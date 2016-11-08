import Ember from 'ember';
const Datauri = require('datauri');
const datauri = new Datauri();
const electron = require('electron');
const fs = require('graceful-fs');
const log = Ember.Logger.log;
const mmm = require('mmmagic');
const Magic = mmm.Magic;
const mainProcess = electron.remote.require('./electron');
const mainWindow = mainProcess.mainWindow;
const currentWindow = electron.remote.getCurrentWindow();

export default Ember.Route.extend({
  setupController(controller, model) {
    this._super(controller, model);
  },
  actions: {
    getDataURI(data) {
      let ctrl = this.controller,
          type = ctrl.get('img-type'),
          src = datauri.format('.' + type.substring(type.indexOf('/') + 1), data).content;

      ctrl.set('img-src', src);
    },
    getFile(file) {
      let ctrl = this.controller,
          path = ctrl.get('dir').concat('/', file),
          magic = new Magic(mmm.MAGIC_MIME_TYPE | mmm.MAGIC_MIME_ENCODING);

      ctrl.set('fileName', file);

      magic.detectFile(path, (err, result) => {
        if(err) {
          throw err;
        } else {
          let opts = result.split(';');

          ctrl.set('img-type', opts[0].replace('jpeg', 'jpg'));

          this.actions.getDataURI.call(this, fs.readFileSync(path));
        }
      });
    },
    openDevTools() {
      currentWindow.toggleDevTools();
    },
    openDir() {
      let ctrl = this.controller;

      ctrl.set('dir', mainProcess.openDir());

      fs.readdir(ctrl.get('dir'), (err, files) => {
        if(err) {
          throw err;
        } else {
          let fileList = [];

          files.forEach(function(file, index) {
            fileList.pushObject(Ember.Object.create({
              id: index,
              name: file
            }));
          });

          ctrl.set('files', fileList);
        }
      });
    },
    openFile() {
      let files = mainProcess.openFile.call(mainWindow);

      switch(true) {
        case files.length > 1:
          //do something to handle multiple files
          break;
        case files.length === 1: {
            let dir = '',
                elif = '',
                file = files[0];

            elif = reverse(file);

            dir = reverse(elif.substring(elif.indexOf('/')));

            this.controller.set('dir', dir);
            this.actions.getFile.call(this, reverse(elif.substring(0, elif.indexOf('/'))));
            break;
          }
        default:
          log('did not select a file');
      }
    }
  }
});

function reverse(string) {
  return string.split('').reverse().join('');
}

var $ = require('jquery/dist/jquery');
var Dropzone = require('dropzone/dist/dropzone');
$(function() {
  var $form = $('form');
  var action = $form.attr('action');
  var dropzone = new Dropzone('form', {
    url: action,
    autoProcessQueue: false,
    uploadMultiple: true,
    previewsContainer: '#dropzone-preview',
    maxFiles: 4,
    parallelUploads: 4,
    paramName: 'image',
    init: function() {
      var dropzone = this;
      var $button = $form.find('button');
      $button.on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (dropzone.getQueuedFiles().length > 0) {
          dropzone.processQueue();
        } else {
          // HAX: dropzone doesn't submit the form when there are no files queued
          $.ajax({
            type: 'POST',
            url: action,
            data: new FormData($form[0]),
            contentType: false,
            processData: false,
            success: function(redirectPath) {
              window.location.replace(redirectPath);
            }
          });
        }
      });

      this.on('success', function(file, redirectPath) {
        if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
          window.location.replace(redirectPath);
        }
      });
    }
  });
});

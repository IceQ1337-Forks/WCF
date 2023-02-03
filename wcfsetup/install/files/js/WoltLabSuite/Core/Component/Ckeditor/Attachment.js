define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initializeAttachment = exports.setupRemoveAttachment = exports.setupInsertAttachment = void 0;
    function uploadAttachment(element, file, abortController) {
        const data = { abortController, file };
        element.dispatchEvent(new CustomEvent("ckeditor5:drop", {
            detail: data,
        }));
        return new Promise((resolve) => {
            void data.promise.then(({ attachmentId, url }) => {
                resolve({
                    "data-attachment-id": attachmentId.toString(),
                    urls: {
                        default: url,
                    },
                });
            });
        });
    }
    function setupInsertAttachment(ckeditor) {
        ckeditor.sourceElement.addEventListener("ckeditor5:insert-attachment", (event) => {
            const { attachmentId, url } = event.detail;
            if (url === "") {
                ckeditor.insertText(`[attach=${attachmentId}][/attach]`);
            }
            else {
                ckeditor.insertHtml(`<img src="${url}" class="woltlabAttachment" data-attachment-id="${attachmentId.toString()}">`);
            }
        });
    }
    exports.setupInsertAttachment = setupInsertAttachment;
    function setupRemoveAttachment(ckeditor) {
        ckeditor.sourceElement.addEventListener("ckeditor5:remove-attachment", ({ detail: attachmentId }) => {
            ckeditor.removeAll("imageBlock", { attachmentId });
            ckeditor.removeAll("imageInline", { attachmentId });
        });
    }
    exports.setupRemoveAttachment = setupRemoveAttachment;
    function initializeAttachment(element, configuration) {
        // TODO: The typings do not include our custom plugins yet.
        configuration.woltlabUpload = {
            uploadImage: (file, abortController) => uploadAttachment(element, file, abortController),
            uploadOther: (file) => uploadAttachment(element, file),
        };
    }
    exports.initializeAttachment = initializeAttachment;
});

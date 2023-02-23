define(["require", "exports", "../../StringUtil", "./Event"], function (require, exports, StringUtil_1, Event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setup = void 0;
    function insertQuote(editor, payload) {
        let { author, content, link } = payload;
        if (payload.isText) {
            content = (0, StringUtil_1.escapeHTML)(content);
        }
        author = (0, StringUtil_1.escapeHTML)(author);
        link = (0, StringUtil_1.escapeHTML)(link);
        editor.insertHtml(`<woltlab-ckeditor-blockquote author="${author}" link="${link}">${content}</woltlab-ckeditor-blockquote>`);
    }
    function setup(element) {
        (0, Event_1.listenToCkeditor)(element).ready(({ ckeditor }) => {
            (0, Event_1.listenToCkeditor)(element).insertQuote((payload) => {
                insertQuote(ckeditor, payload);
            });
        });
    }
    exports.setup = setup;
});

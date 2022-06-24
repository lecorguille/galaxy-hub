// The index (in root's children) of the first node of the table of contents.
const TOC_START = 0;
// The number of top-level nodes (children of root) that comprise the table of contents (excluding
// the ending header).
const TOC_SIZE = 2;
import { HEADING_TEXT, HEADING_ENDING } from "./toc-add.mjs";

/** Table of contents remodeling plugin.
 * This takes a page with table of contents generated by remark-toc (with the help of toc-add.mjs) and separates the
 * table of contents and body into their own sections. The input contains the table of contents mixed in with the rest
 * of the body contents. This will create two top-level divs with the table of contents in the first one and the body
 * in the second.
 * @param {Object} [opts] Options.
 * @param {Object} [opts.tocAttrs]  Values for any HTML attributes to insert into the `<div>
 *   wrapping the table of contents. WARNING: The values are inserted literally between double
 *   quotes into the string, so mind the content.
 * @param {Object} [opts.bodyAttrs] Same as `opts.tocAttrs` but for the body wrapper.
 */
export default function attacher(opts) {
    if (opts === undefined) {
        opts = {};
    }
    function transformer(tree) {
        if (hasAutoToc(tree)) {
            removeNode(tree, "heading", HEADING_TEXT);
            removeNode(tree, "heading", HEADING_ENDING);
            // Wrap the ToC.
            wrapNodes(tree, TOC_START, TOC_SIZE - 1, opts.tocAttrs);
            // Wrap the body.
            wrapNodes(tree, TOC_START + TOC_SIZE + 1, tree.children.length, opts.bodyAttrs);
            // Add a clearfix after.
            addClearFix(tree, tree.children.length);
        }
    }
    return transformer;
}

/** Does this have one of our automatically-inserted ToCs (with the actual ToC already inserted by remark-toc)?
 * This checks if the document starts with the heading HEADING_TEXT, followed by a list (presumably the ToC itself),
 * followed by the heading HEADING_ENDING.
 */
function hasAutoToc(tree) {
    if (tree.children.length < 3) {
        return false;
    }
    let heading = tree.children[0];
    let list = tree.children[1];
    let endHeading = tree.children[2];
    if (!(heading.type === "heading" && heading.data && heading.data.id === HEADING_TEXT)) {
        return false;
    }
    if (!(list.type === "list")) {
        return false;
    }
    if (!(endHeading.type === "heading" && endHeading.data && endHeading.data.id === HEADING_ENDING)) {
        return false;
    }
    return true;
}

function removeNode(tree, nodeType, idText) {
    for (let i in tree.children) {
        let node = tree.children[i];
        if (node.type === nodeType && node.data && node.data.id === idText) {
            tree.children.splice(i, 1);
            return;
        }
    }
}

function wrapNodes(tree, start, end, wrapperAttrs = {}) {
    let wrapperStart = {
        type: "html",
        value: makeTag("div", wrapperAttrs),
    };
    let wrapperEnd = {
        type: "html",
        value: "</div>",
    };
    tree.children.splice(start, 0, wrapperStart);
    tree.children.splice(end + 1, 0, wrapperEnd);
}

function addClearFix(tree, start) {
    let clearfix = {
        type: "html",
        value: '<div class="clearfix"></div>',
    };
    tree.children.splice(start, 0, clearfix);
}

function makeTag(tagName, attrs) {
    let tag = "<" + tagName;
    Object.entries(attrs)
        .map(([attr, value]) => `${attr}="${value}"`)
        .forEach((attrStr) => (tag += " " + attrStr));
    tag += ">";
    return tag;
}

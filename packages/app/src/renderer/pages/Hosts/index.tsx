import CodeMirror from "@uiw/react-codemirror";
import "@codemirror/comment";
import e from "../../utils/editor";
import { classHighlightStyle } from "@codemirror/highlight";

const txt = [
  "52.74.223.119     github.com",
  "52.74.223.119   gist.github.com",
  "54.169.195.247   api.github.com",
  "185.199.111.153   assets-cdn.github.com",
  "151.101.76.133    raw.githubusercontent.com",
  "151.101.76.133    gist.githubusercontent.com",
  "151.101.76.133    cloud.githubusercontent.com",
  "151.101.76.133    camo.githubusercontent.com"
];

import { tags, HighlightStyle } from "@codemirror/highlight";

const myHighlightStyle = HighlightStyle.define([
  { tag: tags.atom, color: "#096dd9" },
  { tag: tags.comment, color: "#090" }
]);

import { EditorView } from "@codemirror/view";

let myTheme = EditorView.theme({
  ".cm-content": {},
  ".cm-selectionMatch": {
    backgroundColor: "#fff"
  },
  ".cm-gutters": {
    backgroundColor: "#fff",
    color: "#999",
    border: "none"
  }
});

function Hosts() {
  return (
    <div className="hosts bg-white h-full">
      <CodeMirror
        theme={[myHighlightStyle, myTheme]}
        value={txt.join("\r\n")}
        height="200px"
        editable={false}
        extensions={[e, classHighlightStyle]}
        onChange={(value, viewUpdate) => {
          console.log("value:", value);
        }}
      />
    </div>
  );
}

export default Hosts;

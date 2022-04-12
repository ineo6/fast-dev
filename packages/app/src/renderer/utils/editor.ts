import { StreamLanguage, StringStream } from "@codemirror/stream-parser";

function tokenize(stream: StringStream, state: any) {
  return (state.tokens[0] || tokenBase)(stream, state);
}

function tokenBase(stream: StringStream) {
  if (stream.eatSpace()) return null;

  let sol = stream.sol();
  let ch = stream.next();

  let s = stream.string;

  if (ch === "#") {
    stream.skipToEnd();
    return "lineComment";
  }

  if (!s.match(/^\s*([\d.]+|[\da-f:.%lo]+)\s+\w/i)) {
    return "error";
  }

  if (sol && ch && ch.match(/[\w.:%]/)) {
    stream.eatWhile(/[\w.:%]/);
    return "atom";
  }

  return null;
}

const language = StreamLanguage.define<{}>({
  startState() {
    return { tokens: [] };
  },

  token(stream: any, state: any) {
    return tokenize(stream, state);
  }
});

export default language;

// Featherweight HCL/terraform highlighter — zero dependencies.
const TOKEN =
  /(#[^\n]*)|("(?:[^"\\\n]|\\.)*")|\b(resource|variable|terraform|required_providers|module|output|data|provider|var|true|false|null)\b|\b(\d+(?:\.\d+)?)\b/g;

const CLS = {
  1: "text-slate-600 italic", // comment
  2: "text-emerald-300", // string
  3: "text-violet-300", // keyword
  4: "text-amber-300", // number
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function highlight(src) {
  let out = "";
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    out += esc(src.slice(last, m.index));
    const gi = [1, 2, 3, 4].find((i) => m[i] !== undefined);
    out += `<span class="${CLS[gi]}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(src.slice(last));
}

export default function CodeBlock({ code, "data-testid": testId }) {
  return (
    <pre
      data-testid={testId}
      className="font-mono text-[11px] leading-5 p-3 overflow-x-auto text-slate-300 whitespace-pre"
      dangerouslySetInnerHTML={{ __html: highlight(code) }}
    />
  );
}

const fs = require('fs');

async function main() {
  const mod = await import('pdf-parse');
  const buf = fs.readFileSync('D:\\Ed_Vision\\ed_vision_backend\\uploads\\certificate\\1777712800362-132015570.pdf');
  const legacyDefault = mod.default || mod;
  const parsed = await legacyDefault(buf);
  fs.writeFileSync('parsed_pdf.txt', parsed.text);
  console.log(parsed.text.substring(0, 1000));
}

main().catch(console.error);

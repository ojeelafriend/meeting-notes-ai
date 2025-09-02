const extractTitle = (text: string) => {
  //Extract title from text on format: [Titulo]
  const title = text.split("\n")[0].replace("[", "").replace("]", "");
  return title;
};

export { extractTitle };

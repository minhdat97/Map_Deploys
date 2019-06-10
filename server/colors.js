const colors = [
  // "tomato",
  // "orange",
  // "gold",
  // "yellow",
  // "wheat",
  // "tan",
  // "linen",
  // "green",
  // "blue",
  // "aqua",
  // "violet",
  // "indigo"
  "#911eb4",
  "#46f0f0",
  "#f032e6",
  "#d2f53c",
  "#fabebe",
  "#008080",
  "#e6beff",
  "#aa6e28",
  "#fffac8",
  "#800000",
  "#aaffc3",
  "#808000",
  "#ffd8b1",
  "#000080"
];

let index = 0;

exports.get = function() {
  const color = colors[index];
  index = ++index % colors.length;
  return color;
};

/**
 * Depth chart order for Game 1 vs Wisconsin.
 * Within each roster position, players are listed starter → backups
 * in the order they appear on the official depth chart.
 * Players not listed fall after these, sorted by jersey number.
 */
export const DEPTH_CHART_BY_POSITION: Record<string, string[]> = {
  WR: [
    "Jordan Faison",
    "Matt Jeffery",
    "Cam Williams",
    "Logan Saldate",
    "Jaden Greathouse",
    "Mylan Graham",
    "Bubba Frazier",
    "Micah Gilbert",
    "Elijah Burress",
    "Jerome Bettis Jr.",
  ],
  OL: [
    "Will Black",
    "Charlie Thom",
    "Grayson McKeogh",
    "Anthonie Knapp",
    "Cam Herron",
    "Ashton Craig",
    "Joe Otting",
    "Sullivan Absher",
    "Styles Prescod",
    "Guerby Lambert",
    "Owen Strebig",
  ],
  TE: [
    "Cooper Flanagan",
    "James Flanigan",
    "Ty Washington",
    "Jack Larsen",
  ],
  QB: ["CJ Carr", "Noah Grubbs", "Teddy Jarrard"],
  RB: [
    "Aneyas Williams",
    "Nolan James Jr.",
    "Kedren Young",
    "Jonaz Walton",
    "Javian Osborne",
  ],
  DL: [
    "Boubacar Traore",
    "Loghan Thomas",
    "Rodney Dunham",
    "Armel Mukam",
    "Francis Brewu",
    "Elijah Hughes",
    "Jason Onye",
    "Tionne Gray",
    "Sean Sevillano Jr.",
    "Bryce Young",
    "Keon Keeley",
  ],
  LB: [
    "Jaiden Ausberry",
    "Jaylen Sneed",
    "Drayk Bowen",
    "Kyngstonn Viliamu-Asa",
    "Madden Faraimo",
  ],
  CB: [
    "Christian Gray",
    "Dallas Golden",
    "Jayden Sanders",
    "Leonard Moore",
    "Mark Zackery IV",
    "DJ McKinney",
  ],
  S: [
    "Adon Shuler",
    "Joey O'Brien",
    "Brauntae Johnson",
    "Luke Talich",
  ],
  P: ["Jasper Scaife", "Erik Schmidt"],
  K: ["Spencer Porath", "Micah Drescher"],
  LS: ["Joseph Vinci", "Andrew Kros"],
};

/** Lower rank = higher on the depth chart. Missing players get a large rank. */
export function depthRank(position: string, name: string): number {
  const order = DEPTH_CHART_BY_POSITION[position];
  if (!order) return Number.MAX_SAFE_INTEGER;
  const index = order.indexOf(name);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

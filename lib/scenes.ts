export type Source = { label: string; url: string };
export type Annotation = {
  id: string;
  title: string;
  text: string;
  position: [number, number, number];
};
export type SceneDefinition = {
  id: string;
  label: string;
  category: string;
  asset: string;
  size: {
    value: number;
    unit: "nm" | "m" | "km" | "au" | "ly";
    display: string;
    measurement: string;
    note: string;
  };
  description: string;
  caveat: string;
  sources: Source[];
  prompts: string[];
  annotations: Annotation[];
  camera: [number, number, number];
};

export const UNIT_METERS = {
  nm: 1e-9,
  m: 1,
  km: 1000,
  au: 149597870700,
  ly: 9460730472580800,
} as const;
export const toMeters = (value: number, unit: keyof typeof UNIT_METERS) =>
  value * UNIT_METERS[unit];

export const scenes: SceneDefinition[] = [
  {
    id: "atom",
    label: "Atom",
    category: "The building blocks",
    asset: "atom.glb",
    size: {
      value: 0.3,
      unit: "nm",
      display: "≈ 0.3 nm",
      measurement: "Representative atomic diameter",
      note: "A representative value within a typical 0.2–0.4 nm range; atoms have no hard outer edge.",
    },
    description:
      "Matter begins here. An atom has a small nucleus surrounded by electrons. Different numbers of protons give us different elements.",
    caveat:
      "The rings are an illustration. Electrons occupy quantum states, not little planetary orbits. The nucleus is enlarged for visibility.",
    sources: [
      {
        label: "US Department of Energy · Atomic dimensions",
        url: "https://www.energy.gov/science/bes/articles/seeing-between-atoms",
      },
      {
        label: "US Department of Energy · Electrons",
        url: "https://www.energy.gov/science/doe-explainselectrons",
      },
    ],
    prompts: [
      "Do electrons really move along these rings?",
      "What determines which element this is?",
    ],
    annotations: [],
    camera: [0, 0, 5.2],
  },
  {
    id: "molecule",
    label: "Molecule",
    category: "Atoms working together",
    asset: "moleculeModel.glb",
    size: {
      value: 1,
      unit: "nm",
      display: "Order of 1 nm",
      measurement: "Illustrative small-molecule width",
      note: "An order-of-magnitude teaching estimate, not a measured diameter of this cytosine model.",
    },
    description:
      "Atoms bond into molecules. This model represents cytosine, one of the bases used in DNA and RNA. In DNA, cytosine pairs with guanine.",
    caveat:
      "Balls and sticks emphasize connections. Colors and sphere sizes are visual conventions, not the literal appearance of atoms.",
    sources: [
      {
        label: "PubChem · Cytosine structure",
        url: "https://pubchem.ncbi.nlm.nih.gov/compound/cytosine",
      },
      {
        label: "NHGRI · DNA fact sheet",
        url: "https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet",
      },
    ],
    prompts: [
      "How does cytosine help encode information?",
      "What do the sticks represent?",
    ],
    annotations: [],
    camera: [6, 1.8, 0],
  },
  {
    id: "dna",
    label: "DNA Helix",
    category: "The language of life",
    asset: "DNAHelix.glb",
    size: {
      value: 2,
      unit: "nm",
      display: "≈ 2 nm",
      measurement: "Double-helix width",
      note: "Width of typical B-form DNA. The length depends on the molecule and is not represented by this value.",
    },
    description:
      "Two strands twist into a double helix. The order of their bases stores biological instructions, while complementary pairing helps the information be copied.",
    caveat:
      "This is a short, simplified segment. Feature markers identify teaching regions, not individual atoms or measured molecular coordinates.",
    sources: [
      {
        label: "NHGRI · DNA fact sheet",
        url: "https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet",
      },
      {
        label: "NCBI · DNA dimensions",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK9944/",
      },
    ],
    prompts: ["What is this part?", "How does DNA store information?"],
    camera: [0, 0.5, 6.4],
    annotations: [
      {
        id: "backbone",
        title: "Sugar–phosphate backbone",
        text: "Alternating sugar and phosphate groups form the outside of each strand. Bases attach to the sugars and point inward.",
        position: [-0.42, 0.7, 0.3],
      },
      {
        id: "base-pairs",
        title: "Complementary base pairs",
        text: "The rungs pair adenine with thymine, and cytosine with guanine. These complementary pairs help preserve information when DNA is copied.",
        position: [0, 0, 0.45],
      },
      {
        id: "two-strands",
        title: "Two strands, opposite directions",
        text: "The strands run in opposite chemical directions. Their winding arrangement gives DNA its double-helix shape.",
        position: [0.42, -0.75, 0.3],
      },
    ],
  },
  {
    id: "beaver",
    label: "Beaver",
    category: "Life at our scale",
    asset: "beaver.glb",
    size: {
      value: 1,
      unit: "m",
      display: "≈ 1 m",
      measurement: "Representative adult length",
      note: "North American beavers are typically about 1–1.2 m long. Individuals vary.",
    },
    description:
      "A familiar animal brings the journey into human scale. Beavers use their teeth, paws, and building behavior to turn streams into wetland habitats.",
    caveat: "A stylized animal, not a measured anatomical reconstruction.",
    sources: [
      {
        label: "Smithsonian’s National Zoo · Beaver",
        url: "https://nationalzoo.si.edu/animals/beaver",
      },
    ],
    prompts: [
      "How do beavers change their habitat?",
      "How big is an adult beaver?",
    ],
    annotations: [],
    camera: [1.8, 1, 6],
  },
  {
    id: "earth",
    label: "Earth",
    category: "Our shared home",
    asset: "earthModel.glb",
    size: {
      value: 12756,
      unit: "km",
      display: "≈ 12,756 km",
      measurement: "Equatorial diameter",
      note: "Earth is slightly flattened at the poles, so its polar diameter is smaller.",
    },
    description:
      "Our planet is a rocky world with liquid water at its surface. Oceans, land, and a thin atmosphere interact to make the environment we call home.",
    caveat:
      "The surface texture is illustrative. Markers introduce Earth systems rather than exact geographic locations; the atmosphere is not shown at physical thickness.",
    sources: [
      {
        label: "NASA · Earth facts",
        url: "https://science.nasa.gov/earth/facts/",
      },
    ],
    prompts: ["What is this part?", "Why is the atmosphere important?"],
    camera: [0, 0.4, 6.4],
    annotations: [
      {
        id: "ocean",
        title: "A world of water",
        text: "Oceans cover about 71% of Earth’s surface. Liquid water is a defining feature of our planet.",
        position: [-0.65, -0.35, 1.22],
      },
      {
        id: "land",
        title: "A rocky surface",
        text: "Earth has a solid crust above its mantle. Large pieces of the crust and uppermost mantle form moving tectonic plates.",
        position: [0.62, 0.65, 1.12],
      },
      {
        id: "atmosphere",
        title: "A thin atmosphere",
        text: "Near the surface, dry air is about 78% nitrogen and 21% oxygen. The atmosphere protects and helps regulate conditions at the surface.",
        position: [0.18, 1.37, 0.3],
      },
    ],
  },
  {
    id: "solar-system",
    label: "Solar System",
    category: "Our stellar neighborhood",
    asset: "solarsystem.glb",
    size: {
      value: 60,
      unit: "au",
      display: "≈ 60 AU",
      measurement: "Width across Neptune’s orbit",
      note: "Twice Neptune’s approximate 30 AU orbital distance. The Solar System extends far beyond Neptune.",
    },
    description:
      "The Sun anchors a family of eight planets and many smaller bodies. An astronomical unit (AU) is approximately the distance from Earth to the Sun.",
    caveat:
      "Planet sizes and orbital spacing are exaggerated independently. This model is not a literal scale map, and Neptune is not the Solar System’s outer boundary.",
    sources: [
      {
        label: "NASA · Neptune facts",
        url: "https://science.nasa.gov/neptune/neptune-facts/",
      },
    ],
    prompts: [
      "Does the Solar System end at Neptune?",
      "What does one AU mean?",
    ],
    annotations: [],
    camera: [0, 5.3, 3.8],
  },
  {
    id: "milky-way",
    label: "Milky Way",
    category: "An island of stars",
    asset: "Milkywaygalaxy.glb",
    size: {
      value: 100000,
      unit: "ly",
      display: "≈ 100,000 ly",
      measurement: "Representative stellar disk diameter",
      note: "A rounded size for the stellar disk, not the extent of the surrounding dark matter halo.",
    },
    description:
      "Our Solar System belongs to the Milky Way, a spiral galaxy containing billions of stars. A light-year measures distance: how far light travels in one year.",
    caveat:
      "An illustrative view from outside our galaxy. We observe the Milky Way from within it, so its large-scale structure is reconstructed from evidence.",
    sources: [
      {
        label: "NASA · How big is the Milky Way?",
        url: "https://science.nasa.gov/universe/exoplanets/our-milky-way-galaxy-how-big-is-space/",
      },
    ],
    prompts: [
      "What is a light-year?",
      "Why can’t we photograph our galaxy from outside?",
    ],
    annotations: [],
    camera: [0, 3, 5.6],
  },
  {
    id: "universe",
    label: "Observable Universe",
    category: "The limit of our view",
    asset: "observableuniverse.glb",
    size: {
      value: 92e9,
      unit: "ly",
      display: "≈ 92 billion ly",
      measurement: "Estimated present-day observable diameter",
      note: "A rounded cosmological estimate. This is not a measurement of the entire universe.",
    },
    description:
      "The observable universe is the region whose light can reach us. Because space has expanded while light traveled, its present-day size is much larger than its age multiplied by light speed.",
    caveat:
      "A conceptual boundary centered on the observer, not a physical shell or an edge of all space. The entire universe may be much larger.",
    sources: [
      {
        label: "NASA · How big is space?",
        url: "https://www.nasa.gov/science-research/astrophysics/how-big-is-space-we-asked-a-nasa-expert-episode-61/",
      },
    ],
    prompts: [
      "Is this the edge of all space?",
      "How can its radius exceed 13.8 billion light-years?",
    ],
    annotations: [],
    camera: [0, 0, 6.4],
  },
];

export const getScene = (id: string) => scenes.find((scene) => scene.id === id);
export const sceneMeters = (scene: SceneDefinition) =>
  toMeters(scene.size.value, scene.size.unit);
export const clampIndex = (index: number) =>
  Math.max(
    0,
    Math.min(scenes.length - 1, Math.trunc(Number.isFinite(index) ? index : 0)),
  );
export function logPosition(meters: number): number {
  if (!Number.isFinite(meters) || meters <= 0)
    throw new RangeError("Length must be finite and positive.");
  const min = -10;
  const max = 27;
  return Math.max(
    0,
    Math.min(100, ((Math.log10(meters) - min) / (max - min)) * 100),
  );
}

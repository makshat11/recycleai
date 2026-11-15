// Stand-in for Groq during local UI testing. Returns realistic, schema-valid
// analyses so the browser flow can be exercised without a real API key.
import http from 'node:http';

const bottle = {
  itemName: 'Plastic Water Bottle',
  description:
    'A single-use drinks bottle, most likely moulded from a clear PET-type plastic with a separate screw cap.',
  materials: ['Likely PET plastic', 'Polypropylene cap'],
  category: 'Plastic Packaging',
  identificationNotes: [
    'Resin type cannot be confirmed from appearance; check the symbol moulded into the base.',
    'The cap is often a different plastic from the bottle body.',
  ],
  possibleActions: ['reuse', 'recycle', 'reduce'],
  safetyLevel: 'caution',
  hazardWarnings: [],
  advantages: [
    'Lightweight and easy to carry',
    'Durable enough for repeated handling',
    'Transparent, so contents are easy to see',
    'Accepted by many kerbside recycling programmes',
  ],
  disadvantages: [
    'Can contribute to plastic pollution if littered',
    'May fragment into microplastics over time',
    'Acceptance for recycling varies between locations',
    'Not every reuse is safe, especially for food or drink',
  ],
  environmentalImpact: {
    improperDisposal:
      'A littered bottle can travel through drains into rivers and the sea, where it breaks into smaller fragments that are very hard to remove.',
    landfill:
      'In landfill the material is stored rather than recovered, taking up space and wasting the energy and feedstock used to make it.',
    recycling:
      'Where the local service accepts this plastic, recycling can return the material to use and reduce demand for newly produced plastic.',
    reuse:
      'Keeping the bottle in use for a suitable non-food purpose delays the need for another object and avoids immediate disposal.',
    wildlifeRisks: [
      'Animals can ingest fragments or become trapped in discarded packaging.',
      'Caps and rings are a common entanglement and choking hazard for birds and fish.',
    ],
  },
  recommendedAction: {
    type: 'recycle',
    explanation:
      'If your local service accepts this type of plastic, rinsing the bottle and putting it in the correct bin is usually the most responsible option once you have finished reusing it.',
    precautions: [
      'Rinse before recycling so residue does not contaminate the batch.',
      'Check whether your service wants the cap on or off.',
    ],
  },
  recyclingGuidance: {
    generalSteps: [
      'Empty and rinse the bottle',
      'Let it dry briefly',
      'Remove or keep the cap according to local instructions',
      'Place it loose in the correct recycling container',
    ],
    localRulesWarning:
      'Acceptance rules differ from place to place, and some services reject certain plastics entirely. Check your local waste authority before assuming this item is recyclable where you live.',
  },
  reuseIdeas: [
    {
      id: 'idea-1',
      title: 'Mini Plant Pot',
      description: 'Turn the lower half of the bottle into a small pot for a seedling or herb.',
      difficulty: 'Easy',
      estimatedTime: '20 minutes',
      materialsNeeded: [
        'Clean, dry plastic bottle',
        'Potting soil',
        'A small plant or seeds',
        'Scissors or a craft knife',
      ],
      instructions: [
        'Wash the bottle thoroughly with soapy water and let it dry completely.',
        'Ask an adult to cut the bottle around the middle, keeping the cut as straight as possible.',
        'Make several small drainage holes in the base.',
        'Smooth or tape over the cut rim so no sharp edge is exposed.',
        'Fill with soil and plant your seedling, then water lightly.',
      ],
      safetyNotes: [
        'Cutting plastic leaves sharp edges -- an adult should do the cutting.',
        'Cover the rim with tape to avoid cuts during handling.',
      ],
      environmentalBenefit:
        'Keeps the bottle in use as a container instead of discarding it, avoiding the need to buy a new pot.',
    },
    {
      id: 'idea-2',
      title: 'Desk Pencil Organiser',
      description: 'A simple holder for pens, pencils and scissors made from the bottle base.',
      difficulty: 'Easy',
      estimatedTime: '15 minutes',
      materialsNeeded: [
        'Clean, dry plastic bottle',
        'Scissors or a craft knife',
        'Tape or fabric for the rim',
        'Optional paint or paper for decoration',
      ],
      instructions: [
        'Clean and dry the bottle completely.',
        'Have an adult cut it to about the height you want for your pens.',
        'Cover the cut edge with tape or glued fabric so it is safe to touch.',
        'Decorate the outside if you like, then stand it on your desk and fill it.',
      ],
      safetyNotes: [
        'Adult supervision for any cutting.',
        'Do not use heat to smooth the plastic -- it can release fumes.',
      ],
      environmentalBenefit:
        'Replaces a purchased desk accessory with something you already had, keeping the material in use.',
    },
    {
      id: 'idea-3',
      title: 'Slow Watering Spike for Plants',
      description:
        'Invert the bottle into soil with small holes so water seeps out gradually while you are away.',
      difficulty: 'Medium',
      estimatedTime: '25 minutes',
      materialsNeeded: [
        'Clean plastic bottle with its cap',
        'A small nail or pin',
        'Water',
        'A potted plant with loose soil',
      ],
      instructions: [
        'Rinse the bottle well; this use is for plants only, not for drinking water.',
        'Ask an adult to pierce three or four very small holes in the cap.',
        'Fill the bottle with plain water and screw the cap on firmly.',
        'Dig a narrow hole in the soil and insert the bottle neck-down, pressing soil around it.',
        'Check after a few hours and widen or add holes if the flow is too slow.',
      ],
      safetyNotes: [
        'Piercing the cap needs an adult and a stable surface.',
        'Do not reuse a bottle that held anything other than drinking water, and never drink from a bottle used this way.',
      ],
      environmentalBenefit:
        'Reduces water waste by delivering it slowly to the roots, and keeps the bottle in service rather than discarding it.',
    },
  ],
  reuseIdeasNotice: null,
  uncertaintyNotice:
    'The exact plastic type cannot be confirmed from a photo or a name alone. Check the recycling symbol on the item, and confirm what your local service accepts.',
};

const battery = {
  itemName: 'Damaged Lithium-Ion Battery',
  description:
    'A rechargeable lithium-ion cell or battery pack showing damage such as swelling, a puncture, leakage or crush marks.',
  materials: ['Lithium-ion cell chemistry', 'Metal casing', 'Plastic housing', 'Electrolyte'],
  category: 'Hazardous Battery / E-Waste',
  identificationNotes: [
    'Any swelling, hissing, heat, leaking fluid or burnt smell means the cell is unsafe to handle normally.',
    'Damage inside a pack is not always visible from the outside.',
  ],
  possibleActions: ['specialized-disposal'],
  safetyLevel: 'hazardous',
  hazardWarnings: [
    'A damaged cell can overheat, vent toxic gas, catch fire or rupture, sometimes with no warning.',
    'The electrolyte is corrosive and can irritate or burn skin, eyes and airways.',
    'Fires involving these cells can reignite after appearing to go out.',
    'Never puncture, crush, cut, heat, charge or dismantle a damaged cell.',
  ],
  advantages: [
    'High energy density, which is why these cells are used in most portable electronics.',
    'Rechargeable over many cycles, reducing single-use battery waste during normal life.',
    'Contains recoverable materials that specialist facilities can process.',
  ],
  disadvantages: [
    'Serious fire and chemical risk once damaged.',
    'Cannot go in household waste or ordinary recycling bins.',
    'Fires in collection trucks and sorting plants are commonly traced to these cells.',
    'Requires a specialist collection route that is not available everywhere.',
  ],
  environmentalImpact: {
    improperDisposal:
      'Discarded in general waste, a damaged cell can ignite inside a bin, a collection vehicle or a sorting facility, and leaking electrolyte and metals can contaminate soil and water.',
    landfill:
      'Landfilling wastes recoverable metals and risks contamination and fire; it is prohibited for batteries in many places.',
    recycling:
      'Specialist battery recyclers can recover metals safely under controlled conditions -- this is the only appropriate recycling route.',
    reuse:
      'A damaged cell must never be reused, repurposed or recharged. Reuse is not an option here.',
    wildlifeRisks: [
      'Leaked electrolyte and heavy metals can contaminate soil and water that animals depend on.',
      'Fires started by discarded cells destroy habitat.',
    ],
  },
  recommendedAction: {
    type: 'specialized-disposal',
    explanation:
      'Take the battery to a household hazardous waste point or a battery collection service that explicitly accepts damaged lithium cells. Until then, isolate it from anything flammable and do not charge it.',
    precautions: [
      'Place it in a non-flammable container such as a metal tin, away from other batteries.',
      'Keep it cool, dry and out of direct sunlight, and away from children and pets.',
      'Do not attempt to tape, wrap or repair a swollen or punctured cell; transport it as it is.',
      'If it is hot, hissing or smoking, move away and contact your local emergency or waste-safety service.',
    ],
  },
  recyclingGuidance: {
    generalSteps: [
      'Stop using and stop charging the device immediately',
      'Isolate the battery in a non-flammable container',
      'Find a collection point that accepts damaged lithium batteries',
      'Hand it over in person and tell staff it is damaged',
    ],
    localRulesWarning:
      'Battery collection arrangements vary widely and not every recycling point accepts damaged cells. Contact your local waste authority or a licensed e-waste handler first rather than assuming.',
  },
  reuseIdeas: [],
  reuseIdeasNotice:
    'No do-it-yourself projects are offered for a damaged lithium-ion battery. Any attempt to open, cut, heat, charge or repurpose it risks fire, toxic fumes and chemical burns. This item needs qualified handling only.',
  uncertaintyNotice:
    'Without seeing the specific cell, assume the worst case and treat it as hazardous.',
};

function generic(name) {
  return {
    ...bottle,
    itemName: name,
    description:
      'A typical household item. This reply comes from the local mock provider used for UI testing, not from a real model.',
    materials: ['Mixed materials -- verify on the item'],
    category: 'General Household Item',
    reuseIdeas: bottle.reuseIdeas.slice(0, 2),
  };
}

const visionFinding = {
  isPhysicalObject: true,
  objectName: 'plastic water bottle',
  likelyMaterials: ['likely clear PET-type plastic', 'polypropylene cap'],
  visibleCondition: 'intact and empty, label still attached',
  otherObjects: [],
  notes: ['resin code not legible in the photo'],
};

const notAnObject = {
  isPhysicalObject: false,
  objectName: 'unclear',
  likelyMaterials: [],
  visibleCondition: 'no discardable object is clearly visible',
  otherObjects: [],
  notes: ['the photo does not show a single clear object'],
};

const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
  });
  req.on('end', () => {
    let systemText = '';
    let userText = '';
    let hasImage = false;
    try {
      const parsed = JSON.parse(raw);
      const system = parsed.messages && parsed.messages[0] && parsed.messages[0].content;
      const user = parsed.messages && parsed.messages[1] && parsed.messages[1].content;
      systemText = typeof system === 'string' ? system : JSON.stringify(system);
      if (Array.isArray(user)) {
        hasImage = user.some((part) => part && part.type === 'image_url');
        userText = user.map((part) => (part && part.type === 'text' ? part.text : '')).join(' ');
      } else {
        userText = typeof user === 'string' ? user : JSON.stringify(user);
      }
    } catch {
      systemText = '';
    }

    const reply = (payload, note) => {
      console.log('[mock] ' + note);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(payload) } }] }));
    };

    // Stage 1: the vision identification prompt.
    if (systemText.includes('You identify everyday objects in photographs')) {
      if (/not-?an-?object|no object/i.test(userText)) {
        return reply(notAnObject, 'vision -> not a physical object');
      }
      return reply(visionFinding, 'vision -> ' + visionFinding.objectName + (hasImage ? ' (image received)' : ' (NO IMAGE!)'));
    }

    // Stage 2: the full analysis prompt.
    const lower = userText.toLowerCase();
    let payload = bottle;
    if (lower.includes('battery') || lower.includes('lithium')) {
      payload = battery;
    } else if (!lower.includes('bottle')) {
      const match = userText.match(/everyday object: "([^"]+)"/i);
      if (match) payload = generic(match[1]);
    }
    return reply(payload, 'analysis -> ' + payload.itemName);
  });
});

server.listen(5599, '127.0.0.1', () => console.log('[mock] provider listening on 5599'));

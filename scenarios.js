/**
 * scenarios.js — 20 Hotel English training scenarios.
 * Each scenario has: topic, guestQuestion, modelAnswer, alternatives[], badOption.
 */

const SCENARIOS = [
  {
    topic: "Check-in",
    guestQuestion: "Hi, I have a reservation under Kim.",
    modelAnswer: "Welcome! May I see your passport, please? I'll complete your check-in right away.",
    alternatives: [
      "Certainly, Mr. Kim. May I see your ID, please?",
      "Welcome, Mr. Kim. Let me pull up your reservation and get your room ready.",
      "Of course. I can help you check in now if you share your passport."
    ],
    badOption: "Wait there. I'm busy now."
  },
  {
    topic: "Check-in",
    guestQuestion: "Could I check in early?",
    modelAnswer: "Certainly. Let me check room availability, and I'll do my best to arrange early check-in.",
    alternatives: [
      "I'd be happy to check if an early check-in room is available.",
      "Yes, let me verify availability and update you in a moment.",
      "I'll check our system now and see what we can do."
    ],
    badOption: "No. Check-in time is check-in time."
  },
  {
    topic: "Check-in",
    guestQuestion: "What time is breakfast?",
    modelAnswer: "Breakfast is served from 6:30 to 10:00 a.m. on the second floor restaurant.",
    alternatives: [
      "Breakfast runs from 6:30 to 10:00 a.m. at our restaurant on floor 2.",
      "Our breakfast service is available until 10:00 a.m. on weekdays.",
      "You can enjoy breakfast on the second floor starting at 6:30 a.m."
    ],
    badOption: "I don't know. Ask someone else."
  },
  {
    topic: "Room Request",
    guestQuestion: "Can I get extra towels?",
    modelAnswer: "Absolutely. I'll have extra towels sent to your room right away.",
    alternatives: [
      "Certainly, I'll ask housekeeping to deliver them shortly.",
      "Of course. How many extra towels would you like?",
      "No problem, I can arrange that immediately."
    ],
    badOption: "Get them yourself from housekeeping."
  },
  {
    topic: "Room Request",
    guestQuestion: "The room is too cold.",
    modelAnswer: "I'm sorry for the inconvenience. I can send engineering staff or help adjust the thermostat now.",
    alternatives: [
      "I apologize. Let me help you fix the temperature right away.",
      "I'm sorry about that. I can send a staff member to assist immediately.",
      "Thank you for letting us know; we'll make it comfortable for you."
    ],
    badOption: "Then wear more clothes."
  },
  {
    topic: "Room Request",
    guestQuestion: "Can I have a late checkout?",
    modelAnswer: "Certainly. Late checkout is available until 1 p.m. today at no extra charge.",
    alternatives: [
      "I'd be happy to arrange a late checkout for you.",
      "Yes, I can extend your checkout time to 1 p.m.",
      "Let me confirm availability for a late checkout."
    ],
    badOption: "No, leave by 11. Rules are rules."
  },
  {
    topic: "Facilities",
    guestQuestion: "Where is the gym?",
    modelAnswer: "Our fitness center is on the 3rd floor and is open 24 hours.",
    alternatives: [
      "The gym is on floor 3, just past the elevators.",
      "You can access the fitness center anytime; it's open 24/7.",
      "It's on the third floor. Please use your key card for entry."
    ],
    badOption: "Somewhere in the building."
  },
  {
    topic: "Facilities",
    guestQuestion: "Do you have airport shuttle service?",
    modelAnswer: "Yes, we do. The shuttle departs every hour from the main entrance.",
    alternatives: [
      "Certainly. Our airport shuttle leaves hourly from the lobby entrance.",
      "Yes, and I can reserve a seat for your preferred time.",
      "We provide shuttle service; may I help you book it?"
    ],
    badOption: "Maybe. Check online."
  },
  {
    topic: "Facilities",
    guestQuestion: "Is there a convenience store nearby?",
    modelAnswer: "Yes, there's one two blocks away. I can mark it on your map.",
    alternatives: [
      "Certainly. It's about a 3-minute walk from here.",
      "Yes, I can show you the quickest route.",
      "There is one nearby, and I can print directions for you."
    ],
    badOption: "I'm not from this area."
  },
  {
    topic: "Transportation",
    guestQuestion: "Can you call a taxi for me?",
    modelAnswer: "Of course. May I know your destination so I can request the best route?",
    alternatives: [
      "Certainly, I can call one now.",
      "Absolutely. A taxi should arrive in about 5 minutes.",
      "I'll arrange it right away. Where are you heading?"
    ],
    badOption: "Use your phone app."
  },
  {
    topic: "Tourist Info",
    guestQuestion: "What places do you recommend nearby?",
    modelAnswer: "If you like local culture, I recommend the city museum and riverside market.",
    alternatives: [
      "I'd recommend the old town, the museum, and the night market.",
      "Certainly. May I suggest a few spots based on your interests?",
      "I can provide a short list with travel times."
    ],
    badOption: "No idea. I never go out."
  },
  {
    topic: "Dining",
    guestQuestion: "Can I book a table at your restaurant tonight?",
    modelAnswer: "Certainly. May I have your preferred time and number of guests?",
    alternatives: [
      "I'd be happy to reserve a table for you.",
      "Of course. What time would you like to dine?",
      "Yes, I can arrange that right now."
    ],
    badOption: "Restaurant is full. Probably."
  },
  {
    topic: "Housekeeping",
    guestQuestion: "Could you clean my room now?",
    modelAnswer: "Certainly. I'll inform housekeeping to prioritize your room immediately.",
    alternatives: [
      "Of course. I'll request immediate room service cleaning.",
      "I can arrange cleaning now; it should be done shortly.",
      "Absolutely. Would the next 20 minutes work for you?"
    ],
    badOption: "Cleaning is only in the morning."
  },
  {
    topic: "Complaint",
    guestQuestion: "The Wi-Fi is not working.",
    modelAnswer: "I'm sorry for the trouble. Let me reset your connection and guide you through it.",
    alternatives: [
      "I apologize for the inconvenience. I'll assist right away.",
      "Thank you for reporting this. I'll contact IT immediately.",
      "Let me help you reconnect step by step."
    ],
    badOption: "Wi-Fi is usually fine, maybe your device."
  },
  {
    topic: "Complaint",
    guestQuestion: "My room is noisy.",
    modelAnswer: "I'm very sorry. I can offer a quieter room or provide earplugs right away.",
    alternatives: [
      "I apologize. Let me check a quieter room for you.",
      "Thank you for telling us. We'll resolve this promptly.",
      "I'm sorry for the disturbance; I can relocate you if you prefer."
    ],
    badOption: "That's normal in hotels."
  },
  {
    topic: "Billing",
    guestQuestion: "Can you explain this charge on my bill?",
    modelAnswer: "Certainly. Let me review the details with you line by line.",
    alternatives: [
      "Of course. I'll clarify each item on your invoice.",
      "I'd be happy to explain this charge in detail.",
      "Let me check the billing record and confirm for you."
    ],
    badOption: "If it's there, you have to pay."
  },
  {
    topic: "Billing",
    guestQuestion: "Can I pay in a different currency?",
    modelAnswer: "Yes, we support major currencies. I can confirm today's exchange rate for you.",
    alternatives: [
      "Certainly. We accept several currencies at today's rate.",
      "Yes, I can show you the available payment options.",
      "Of course. Let me explain the conversion before payment."
    ],
    badOption: "Only local currency. No exceptions."
  },
  {
    topic: "Checkout",
    guestQuestion: "I need a receipt emailed to me.",
    modelAnswer: "Certainly. Please share your email address, and I'll send it immediately.",
    alternatives: [
      "Of course. I can email the receipt right away.",
      "Yes, I'll send a digital copy after checkout.",
      "Happy to help. Please confirm your email address."
    ],
    badOption: "Printed receipt only."
  },
  {
    topic: "Emergency",
    guestQuestion: "I lost my room key.",
    modelAnswer: "No worries. I'll issue a new key after verifying your identity.",
    alternatives: [
      "Certainly. For security, may I see your ID first?",
      "I can help immediately and deactivate the lost key.",
      "Of course. I'll provide a replacement key now."
    ],
    badOption: "That's your problem."
  },
  {
    topic: "General",
    guestQuestion: "Can you store my luggage after checkout?",
    modelAnswer: "Absolutely. We can store your luggage safely until this evening.",
    alternatives: [
      "Yes, luggage storage is available at the front desk.",
      "Certainly. We'll tag your bags and keep them secure.",
      "Of course. Please bring your bags here and we'll assist you."
    ],
    badOption: "No storage service."
  }
];

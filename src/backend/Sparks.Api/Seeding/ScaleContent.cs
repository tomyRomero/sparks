using Sparks.Api.Posts.Data;

namespace Sparks.Api.Seeding;

/// <summary>
/// Text for <see cref="ScaleSeeder"/>: names, bios, sparks of every kind,
/// comments and chat lines, put together from small banks of parts so tens
/// of thousands of them read like people wrote them and rarely repeat.
/// </summary>
internal sealed class ScaleContent(Random random)
{
    private static readonly string[] FirstNames =
    [
        "Maya", "Leo", "Aisha", "Noah", "Zara", "Ethan", "Lina", "Mateo", "Hana", "Oscar", "Priya", "Felix",
        "Chloe", "Ravi", "Elena", "Jonah", "Sana", "Hugo", "Ines", "Kai", "Lucia", "Marcus", "Nadia", "Owen",
        "Paloma", "Quinn", "Rosa", "Samir", "Tess", "Umar", "Vera", "Wes", "Yara", "Zane", "Ada", "Bruno",
        "Clara", "Dev", "Esme", "Finn", "Gia", "Hector", "Ivy", "Jae", "Kira", "Luca", "Mila", "Nico", "Olive",
        "Pablo", "Rhea", "Soren", "Talia", "Uma", "Viktor", "Willa", "Xavi", "Yusuf", "Zoe", "Amir", "Bea",
        "Cyrus", "Dina", "Emil", "Freya", "Gabe", "Hira", "Iker", "Juno", "Kofi", "Lea", "Milo", "Nora",
        "Omar", "Pia", "Reza", "Sofia", "Theo", "Usha", "Vik", "Wren", "Yuki", "Zeke", "Anya", "Basil",
    ];

    private static readonly string[] LastNames =
    [
        "Chen", "Patel", "Garcia", "Kim", "Nguyen", "Okafor", "Silva", "Novak", "Haddad", "Rossi", "Muller",
        "Tanaka", "Lopez", "Andersen", "Moreau", "Kowalski", "Mensah", "Ibrahim", "Costa", "Varga", "Lindqvist",
        "Ortiz", "Petrov", "Sato", "Walsh", "Ahmed", "Becker", "Cruz", "Dubois", "Eriksen", "Fischer", "Gomez",
        "Hughes", "Ito", "Jensen", "Khan", "Laine", "Mori", "Nakamura", "Oliveira", "Park", "Quinn", "Reyes",
        "Santos", "Torres", "Ueda", "Vidal", "Weber", "Yilmaz", "Zhou", "Abbott", "Bianchi", "Castro", "Diaz",
        "Ellis", "Ferreira", "Grant", "Hart", "Iqbal", "Jovanovic", "Keller", "Lam", "Meyer", "Nilsen",
    ];

    private static readonly string[] BioStarts =
    [
        "Designer by day, night owl by choice.", "Writing the book I wish I'd read.", "Film nerd and noodle critic.",
        "Collecting sunsets and bad puns.", "Product engineer who still prints photos.", "Teacher, cyclist, haiku addict.",
        "Painting small things very slowly.", "Coffee first, ideas second.", "Learning to cook one disaster at a time.",
        "Amateur astronomer with a cheap telescope.", "Thrift-store fashion archaeologist.", "Here for the plot twists.",
        "Street photographer with sore feet.", "Recovering perfectionist.", "Building things that make people smile.",
    ];

    private static readonly string[] BioEnds =
    [
        "", " Based in Lisbon.", " Based in Toronto.", " Based in Seoul.", " Based in Nairobi.", " Based in Berlin.",
        " She/her.", " He/him.", " They/them.", " Opinions are my cat's.", " Say hi!", " Slow replies, warm ones.",
    ];

    private static readonly string[] Thoughts =
    [
        "the first coffee of the morning tastes better when nobody else is awake",
        "rainy Sundays are the best time to start a new notebook",
        "a good playlist can rescue almost any long drive",
        "the library smells exactly like it did when I was nine",
        "I finally fixed the squeaky door and now the house feels too quiet",
        "my plants grew more this month than my savings did",
        "the bus driver waved at every kid on the route today",
        "nothing beats the sound of a city just before sunrise",
        "I wrote three pages before breakfast and none of them were emails",
        "my neighbour's dog has learned to open the gate, and honestly, respect",
        "the best ideas show up the moment you stop looking for them",
        "I said yes to a pottery class and the bowl is lopsided and perfect",
        "small talk with strangers is underrated",
        "some songs only work at 2 a.m. with the windows open",
        "I walked home the long way and found a bakery I'd never noticed",
        "my grandmother's recipe works better when you don't measure anything",
        "learning a new language makes you funny again, mostly by accident",
        "the moon looked close enough to touch tonight",
        "a handwritten letter arrived today and it made my whole week",
        "the hardest part of any project is the first honest draft",
        "the train was late, so I finally finished my book",
        "I tried to be productive and ended up reorganising my spice rack",
        "every city has one perfect bench, and I found ours",
        "my code compiled on the first try and now I don't trust it",
        "a stranger complimented my coat and I've been smiling for an hour",
        "watching the snow fall is the cheapest therapy I know",
        "the kids next door built a lemonade empire this summer",
        "I keep a list of tiny good things and it's getting long",
        "making soup for friends is a love language",
        "I finally understand why people get up early for sunrises",
        "the mechanic explained my car like a bedtime story",
        "it's wild how much a clean desk changes the whole day",
        "a power cut turned into the best board game night we've had",
        "I learned to whistle with two fingers at thirty-one",
        "the farmers' market peaches are back and life is good",
        "my running app says I'm getting faster and I believe it",
        "I fixed my bike chain with a video and a lot of patience",
        "old cameras make you slow down and look properly",
        "the sea was so still this morning it looked like glass",
        "I found my childhood drawings and they're weirdly good",
    ];

    private static readonly string[] ThoughtOpeners =
    [
        "", "", "", "Small win today: ", "Hot take: ", "Note to self: ", "Today I learned ", "Reminder that ",
        "Tiny joy: ", "Honestly, ", "Can confirm ", "Overheard on the train: ", "Life update: ",
    ];

    private static readonly string[] ThoughtClosers =
    [
        ".", ".", ".", "!", ". Anyone else?", ". Change my mind.", ". 10/10 would recommend.", " ☀️", ". That's it, that's the post.",
        ". More soon.", " 🌧️", ". Grateful.", ". What a day.",
    ];

    private static readonly string[] HaikuFirst =
    [
        "Morning fog lifting", "A cold cup of tea", "Late train, empty seats", "Cherry blossoms fall", "Snow on the rooftops",
        "Streetlights flicker on", "The kettle whistles", "Low tide at sunrise", "One paper lantern", "Wet leaves on the path",
        "The old dog sleeping", "Thunder far away", "A crow on the wire", "Moonlight on the lake", "Bread cooling slowly",
        "Night shift ends at dawn", "Wind chimes in the dark", "First frost on the glass", "A letter unread", "Bees in the lavender",
    ];

    private static readonly string[] HaikuMiddle =
    [
        "the city breathes out slowly", "a sparrow tests the cold air", "my thoughts drift like paper boats",
        "someone hums a song I know", "the river forgets its name", "shadows stretch across the floor",
        "the clock forgets to tick on", "a bicycle bell rings twice", "the rain writes on every roof",
        "the radio crackles low", "footprints fill with silver light", "steam curls from the open door",
        "the garden waits for the sun", "a moth circles the warm lamp", "the last bus hums down the road",
        "my coffee goes cold again", "the hills fold into the dusk", "children chase the falling light",
    ];

    private static readonly string[] HaikuLast =
    [
        "and then, quiet", "spring arrives", "nobody hurries", "home at last", "the day begins", "I let it go",
        "still here, still warm", "the stars agree", "one more page", "a door opens", "slow and certain",
        "the world exhales", "I stay a while", "and so do I", "light finds the way",
    ];

    private static readonly (string Setup, string Punchline)[] Jokes =
    [
        ("I told my plants a joke.", "They didn't laugh, but they grew on me."),
        ("Why don't skeletons fight each other?", "They don't have the guts."),
        ("I'm reading a book about anti-gravity.", "It's impossible to put down."),
        ("Why did the scarecrow win an award?", "He was outstanding in his field."),
        ("I asked the librarian for books about paranoia.", "She whispered, \"They're right behind you.\""),
        ("Why did the bicycle fall over?", "It was two tired."),
        ("My calendar's days are numbered.", "Honestly, so are mine."),
        ("Why can't you trust stairs?", "They're always up to something."),
        ("I started a band called 999 Megabytes.", "We haven't gotten a gig yet."),
        ("Why did the coffee file a police report?", "It got mugged."),
        ("I tried to catch fog yesterday.", "Mist."),
        ("Why do bees have sticky hair?", "They use honeycombs."),
        ("My camera and I broke up.", "It said I never focus on us."),
        ("Why did the developer quit their job?", "They didn't get arrays."),
        ("I wondered why the frisbee kept getting bigger.", "Then it hit me."),
        ("Why was the math book sad?", "It had too many problems."),
        ("What do you call a fake noodle?", "An impasta."),
        ("Why don't eggs tell jokes?", "They'd crack each other up."),
        ("I used to play piano by ear.", "Now I use my hands."),
        ("What did the ocean say to the beach?", "Nothing, it just waved."),
        ("Why did the tomato blush?", "It saw the salad dressing."),
        ("I'm on a seafood diet.", "I see food and I eat it."),
        ("Why are ghosts bad liars?", "You can see right through them."),
        ("What do you call a sleeping dinosaur?", "A dino-snore."),
        ("Why did the cookie go to the doctor?", "It felt crummy."),
        ("I told my suitcase there'd be no trip this year.", "Now I'm dealing with emotional baggage."),
        ("Why did the golfer bring two pairs of trousers?", "In case he got a hole in one."),
        ("What's orange and sounds like a parrot?", "A carrot."),
        ("Why can't a nose be twelve inches long?", "Because then it'd be a foot."),
        ("Why did the stadium get hot after the game?", "All the fans left."),
    ];

    private static readonly string[] Quotes =
    [
        "Courage is just curiosity that refused to sit down.", "Every map was once a guess someone wrote down.",
        "Kindness is the only language every stranger speaks.", "The best view comes after the hardest climb.",
        "Ideas are seeds; attention is the weather.", "A small light in a dark room changes everything.",
        "Rest is part of the work, not a break from it.", "You don't find time, you make it out of habits.",
        "Listen long enough and the quiet starts to talk.", "Not every storm comes to break you; some clear the path.",
        "Start before you're ready; ready is a rumour.", "The ocean is made of drops that kept going.",
        "Wonder is a muscle. Use it daily.", "What you water grows, including worry.",
        "A good question opens more doors than a loud answer.", "Even the tallest tree began as a stubborn seed.",
        "Be the reason someone checks the sky tonight.", "Patience is just faith with a longer timeline.",
        "Your pace is still progress.", "The days are long, but the light is generous.",
    ];

    private static readonly string[] Aphorisms =
    [
        "Done is a door; perfect is a wall.", "Write the messy version first.", "Every expert was once a beginner who stayed.",
        "Quiet minds hear better ideas.", "If it scares you a little, it might be worth it.", "Walk more, worry less.",
        "Ask, then listen twice as long.", "Make it work, then make it kind.", "Collect moments, not things.",
        "The detour is part of the route.", "Small steps still leave footprints.", "Curiosity outlasts motivation.",
        "Plans are drafts. Keep editing.", "Ship it, learn, repeat.", "Nothing grows in a hurry.",
        "Look up more often.", "Be gentle with beginnings.", "A shared idea doubles.", "Silence is also an answer.",
        "Light travels; so can you.",
    ];

    private static readonly string[] TitleAdjectives =
    [
        "Silent", "Paper", "Golden", "Last", "Hidden", "Borrowed", "Electric", "Crimson", "Northern", "Hollow", "Glass",
        "Midnight", "Lost", "Second", "Quiet", "Wild", "Broken", "Salt", "Distant", "Burning", "Velvet", "Iron",
    ];

    private static readonly string[] TitleNouns =
    [
        "Harbour", "Signal", "Orchard", "Kingdom", "Letters", "Tide", "Atlas", "Lantern", "Summer", "Frequency", "Garden",
        "Echo", "Compass", "Station", "Engine", "Archive", "Horizon", "Bridge", "Island", "Season", "Mirror", "Choir",
    ];

    private static readonly string[] Heroes =
    [
        "a retired astronaut", "a teenage radio DJ", "a night-shift nurse", "a disgraced chess champion", "a lighthouse keeper",
        "a small-town baker", "an exhausted detective", "a runaway cartographer", "a shy museum guard", "a street musician",
        "a burned-out chef", "a botanist on her last expedition", "a mail carrier with a secret", "twin sisters estranged for years",
        "an elderly magician", "a stubborn ferry captain", "a translator who hears too much", "a sleep-deprived new father",
    ];

    private static readonly string[] Discoveries =
    [
        "finds a map to a city that sank a century ago", "receives letters dated ten years in the future",
        "discovers the town clock controls the weather", "inherits a house where every room is a different year",
        "hears a song only she can hear, every night at 3 a.m.", "uncovers a library that writes itself",
        "wakes up with someone else's memories", "finds a door in the subway that wasn't there yesterday",
        "learns that the moon has been slowly getting closer", "is hired to guard an empty vault",
        "keeps getting phone calls from her younger self", "finds a camera whose photos show tomorrow",
    ];

    private static readonly string[] Stakes =
    [
        "and has one week to set it right before the tide turns", "and must decide who to trust before the festival ends",
        "but every answer costs a memory", "and the only person who believes them is a talking crow",
        "while the whole town pretends nothing is wrong", "and the clock starts running backwards",
        "but fixing it means losing the people they love", "and a storm is three days away",
        "while an old rival races to get there first", "and the truth is closer to home than anyone thinks",
    ];

    private static readonly string[] Mediums =
    [
        "Oil on linen", "Watercolour on cotton paper", "Charcoal and chalk", "Cut paper and gold leaf", "Acrylic on wood panel",
        "Ink and wash", "Digital painting", "Linocut print", "Gouache on board", "Mixed media collage", "Pastel on grey paper",
    ];

    private static readonly string[] Scenes =
    [
        "A kitchen table set for someone who hasn't arrived yet", "A city skyline folded out of old train tickets",
        "Two moons over a field of sleeping sheep", "A lighthouse made of stacked teacups",
        "A fox reading a newspaper in the rain", "A staircase spiralling into a summer sky",
        "A whale drifting slowly above a quiet village", "A greenhouse full of paper birds",
        "An empty swimming pool filled with autumn leaves", "A violin growing branches and blossoms",
        "A bus stop at the edge of the universe", "A grandmother knitting the northern lights",
    ];

    private static readonly string[] Feelings =
    [
        "It feels like the second before a good surprise.", "It leaves the quiet feeling of time slowing down.",
        "It reads like a love note to everyone who stays up late.", "Warm, strange and a little homesick.",
        "Meant to be looked at for a long time.", "A study in patience and soft light.",
        "Playful at first glance, lonely at the second.", "It hums with that holiday-morning feeling.",
    ];

    private static readonly string[] Garments =
    [
        "A long charcoal coat", "A cropped denim jacket", "A pleated midi skirt", "A chunky cable-knit sweater",
        "A boxy linen shirt", "A tailored rust blazer", "A quilted vest", "A flowing silk slip dress",
        "Wide-leg wool trousers", "A vintage leather bomber", "An oversized trench", "A ribbed turtleneck",
    ];

    private static readonly string[] Materials =
    [
        "recycled sailcloth", "undyed wool", "washed silk", "heavy canvas", "soft corduroy", "deadstock tweed",
        "organic cotton", "hand-woven linen", "brushed mohair",
    ];

    private static readonly string[] Details =
    [
        "brass buttons", "a hand-printed lining of tide charts", "contrast stitching", "deep patch pockets",
        "a dropped shoulder", "raw hems", "a hidden hood", "embroidered constellations on the cuffs",
    ];

    private static readonly string[] Pairings =
    [
        "worn with white trainers", "over a sea-glass green knit", "with rope-soled boots", "with a beret and silver hoops",
        "over a plain grey tee", "with loafers and bright socks", "with a crossbody bag and a messy bun",
    ];

    private static readonly string[] Inspirations =
    [
        "Inspired by harbour workers at first light.", "Utility meets weekend market.", "Built to be worn hard and loved long.",
        "A nod to 70s train travel posters.", "For long walks and longer conversations.", "Grandad's wardrobe, remixed.",
    ];

    private static readonly string[] Subjects =
    [
        "A lone cyclist", "An old fisherman", "Two kids racing paper boats", "A street vendor", "A dancer in a red coat",
        "A sleepy cat", "A couple sharing an umbrella", "A violinist", "A heron", "A delivery rider", "A grandmother",
    ];

    private static readonly string[] Settings =
    [
        "crossing a rain-soaked bridge at blue hour", "in a doorway lit by the last of the sun",
        "on an empty platform at midnight", "under a flickering neon sign", "at the edge of a frozen lake",
        "in a market full of steam and lanterns", "on a rooftop above the morning fog", "beside a wall of peeling posters",
    ];

    private static readonly string[] Techniques =
    [
        "Shot at 35mm from low down, slow shutter turning traffic into ribbons.", "85mm, shallow focus, dust hanging in the light.",
        "Film, pushed two stops, grain like sand.", "Wide open at f/1.8, everything else melting away.",
        "Long exposure, tripod on a railing, held my breath.", "Black and white, high contrast, harsh noon shadows.",
    ];

    private static readonly string[] CommentLines =
    [
        "This made my morning.", "Okay, this is beautiful.", "I needed to read this today.", "Ha! Love it.",
        "Saving this one.", "The last line got me.", "So good.", "Can't stop thinking about this.", "Honestly iconic.",
        "This is exactly how I feel.", "Wait, this is brilliant.", "Sending this to my sister.", "More of this please.",
        "The colours though!", "Underrated post.", "I laughed way too loud at this.", "This deserves more likes.",
        "Same energy as my whole week.", "Absolutely stunning.", "Where was this taken?", "Okay but the title!",
        "You always find the best words.", "Reading this on the bus and smiling like a fool.", "Big yes.",
        "This is going on my fridge.", "Chef's kiss.", "Love the vibe here.", "I've read this five times now.",
        "Ten out of ten.", "This one hits different.", "Wow.", "Pure poetry.", "Didn't expect to feel things today.",
    ];

    private static readonly string[] ReplyLines =
    [
        "Right?!", "Agreed, completely.", "Same here.", "Ha, exactly.", "Thank you!", "So glad it landed.",
        "You get it.", "Haha yes.", "That means a lot.", "Couldn't have said it better.", "Truly.", "100%.",
    ];

    private static readonly string[] ChatLines =
    [
        "Hey! How's your week going?", "Did you see the sunset tonight?", "Haha, that's amazing.", "Sending you the link now.",
        "Are we still on for Saturday?", "I loved your last spark.", "Can't wait!", "That's so true.", "Coffee soon?",
        "Just landed, talk later.", "Okay that made me laugh.", "What are you working on lately?", "Thanks so much!",
        "No worries at all.", "Let me check and get back to you.", "Sounds perfect.", "I'm in.", "See you there!",
        "That photo is unreal.", "Ha, classic.", "How did it go?", "Proud of you!", "Same time next week?",
        "Totally agree.", "Good luck today!", "Running five minutes late, sorry!", "Miss you!", "Happy Friday!",
        "Did you finish the book?", "Okay, now I'm hungry.", "Haha, stop.", "Let's do it.", "Night!",
    ];

    /// <summary>A display name, as first and last name.</summary>
    public (string First, string Last) Name() => (Pick(FirstNames), Pick(LastNames));

    public string? Bio() => random.NextDouble() < 0.6 ? Pick(BioStarts) + Pick(BioEnds) : null;

    public string Spark(SparkKind kind) => kind switch
    {
        SparkKind.Haiku => $"{Pick(HaikuFirst)}\n{Pick(HaikuMiddle)}\n{Pick(HaikuLast)}",
        SparkKind.Joke => Joke(),
        SparkKind.Quote => Pick(Quotes),
        SparkKind.Aphorism => Pick(Aphorisms),
        SparkKind.MovieScript or SparkKind.BookPlot =>
            $"Title: {Title()}\n\n{Capitalise(Pick(Heroes))} {Pick(Discoveries)}, {Pick(Stakes)}.",
        SparkKind.Artwork => $"Title: {Title()}\n\n{Pick(Mediums)}. {Pick(Scenes)}. {Pick(Feelings)}",
        SparkKind.Fashion =>
            $"{Pick(Garments)} in {Pick(Materials)} with {Pick(Details)}, {Pick(Pairings)}. {Pick(Inspirations)}",
        SparkKind.Photography => $"{Pick(Subjects)} {Pick(Settings)}. {Pick(Techniques)}",
        _ => Thought(),
    };

    public string Comment() => Pick(CommentLines);

    public string Reply() => Pick(ReplyLines);

    /// <summary>A chat line, never the same as the one before it.</summary>
    public string ChatLine(string? after)
    {
        var line = Pick(ChatLines);
        return line == after ? ChatLine(after) : line;
    }

    private string Joke()
    {
        var (setup, punchline) = Jokes[random.Next(Jokes.Length)];
        return $"{setup}\n\n{punchline}";
    }

    private string Thought()
    {
        var opener = Pick(ThoughtOpeners);
        var thought = Pick(Thoughts);
        return (opener.Length == 0 ? Capitalise(thought) : opener + thought) + Pick(ThoughtClosers);
    }

    private string Title() => $"The {Pick(TitleAdjectives)} {Pick(TitleNouns)}";

    private string Pick(string[] options) => options[random.Next(options.Length)];

    private static string Capitalise(string text) => char.ToUpperInvariant(text[0]) + text[1..];
}

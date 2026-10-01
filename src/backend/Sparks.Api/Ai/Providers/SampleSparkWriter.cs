using System.Security.Cryptography;
using System.Text;
using Sparks.Api.Ai.Services;
using Sparks.Api.Posts.Data;

namespace Sparks.Api.Ai.Providers;

/// <summary>
/// Hand-written drafts for every kind, for running without an AI key: in
/// development, in tests and in demos. The same prompt always gets the same
/// draft, so tests and screenshots are repeatable.
/// </summary>
public sealed class SampleSparkWriter : ISparkWriter
{
    private static readonly Dictionary<SparkKind, string[]> Drafts = new()
    {
        [SparkKind.MovieScript] =
        [
            "Title: The Last Signal\n\nWhen a lighthouse keeper (Florence Pugh) picks up a radio message that " +
            "shouldn't exist, she and a sceptical engineer (Dev Patel) race an oncoming storm to find who sent " +
            "it, and why it is addressed to her. As the night closes in, the signal starts answering back.",
            "Title: Second Shift\n\nA burned-out night-shift nurse (Viola Davis) discovers that the hospital's " +
            "oldest patient (Ian McKellen) remembers tomorrow. Together they have one week to stop an accident " +
            "only he has seen, without anyone believing a word they say.",
        ],
        [SparkKind.BookPlot] =
        [
            "Title: The Cartographer's Daughter\n\nMira inherits her father's unfinished atlas and finds a coast " +
            "that no ship has ever charted. To finish his last map she must sail to it, and learn why every " +
            "sailor who went before came home with blank pages.",
            "Title: Salt and Static\n\nIn a seaside town where the radio only plays the future, a teenage DJ " +
            "hears her own obituary, dated three weeks away. She has until then to change the song.",
        ],
        [SparkKind.Artwork] =
        [
            "Title: Tide Clock\n\nOil on linen. A kitchen clock half-sunk in a calm sea at dawn, its hands made " +
            "of driftwood, gulls resting on the numbers. It leaves the quiet feeling of time that has stopped " +
            "rushing.",
            "Title: Borrowed Light\n\nCut paper and gold leaf. A city skyline built from folded letters, every " +
            "window lit from behind. It reads as a love note to everyone who stays up late.",
        ],
        [SparkKind.Fashion] =
        [
            "A long charcoal wool coat with a sharp shoulder and a lining of hand-printed tide charts, over a " +
            "sea-glass green knit and wide trousers. Inspired by harbour workers at first light.",
            "A cropped jacket in recycled sailcloth with brass eyelets, a pleated midi skirt in storm grey and " +
            "rope-soled boots. Utility meets regatta, built to be worn hard.",
        ],
        [SparkKind.Photography] =
        [
            "A lone cyclist crossing a rain-soaked bridge at blue hour, city lights smeared in the puddles. " +
            "Shot at 35mm from low down, with a slow shutter turning the traffic into ribbons of red and white.",
            "An old fisherman mending nets in a doorway, lit only by the sun sliding through a gap in the " +
            "roof. 85mm, shallow focus, dust hanging in the light.",
        ],
        [SparkKind.Haiku] =
        [
            "Autumn wind at dusk\nthe streetlights blink awake one\nby one, like a thought",
            "Rain on the window\na cat counts every droplet\nthen falls fast asleep",
        ],
        [SparkKind.Quote] =
        [
            "Curiosity is a compass that never points the same way twice.",
            "The brightest fires all started as small sparks someone decided to protect.",
        ],
        [SparkKind.Joke] =
        [
            "I told my computer I needed a break.\n\nIt said it would go to sleep and see how I felt in the morning.",
            "Why did the developer go broke?\n\nThey used up all their cache.",
        ],
        [SparkKind.Aphorism] =
        [
            "Every draft is braver than a blank page.",
            "The shortest way to a good idea is a long walk.",
        ],
    };

    private static readonly Dictionary<SparkKind, string> ImagePrompts = new()
    {
        [SparkKind.MovieScript] = "A cinematic poster: a lone figure on a rocky coast at night, a lighthouse beam cutting through storm clouds.",
        [SparkKind.BookPlot] = "An illustrated book cover: a small sailing boat on a glassy sea under a sky full of hand-drawn map lines.",
        [SparkKind.Artwork] = "A surreal oil painting of a clock sinking into a calm sea at dawn, gulls resting on its numbers.",
        [SparkKind.Fashion] = "A fashion editorial photo on a foggy harbour: a model in a long charcoal coat with a patterned lining.",
        [SparkKind.Photography] = "A cyclist crossing a rain-soaked bridge at blue hour, city lights reflected in puddles, long exposure.",
    };

    public Task<SparkDraft> DraftAsync(SparkKind kind, string prompt, CancellationToken ct)
    {
        if (!Drafts.TryGetValue(kind, out var drafts))
        {
            throw new ArgumentOutOfRangeException(nameof(kind), kind, "Regular sparks have no AI draft.");
        }

        var body = drafts[Pick(prompt, drafts.Length)];
        return Task.FromResult(new SparkDraft(body, ImagePrompts.GetValueOrDefault(kind)));
    }

    /// <summary>A stable choice from the prompt, so the same idea gets the same draft.</summary>
    private static int Pick(string prompt, int count) =>
        SHA256.HashData(Encoding.UTF8.GetBytes(prompt))[0] % count;
}

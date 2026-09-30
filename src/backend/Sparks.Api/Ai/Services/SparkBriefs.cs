using Sparks.Api.Posts.Data;

namespace Sparks.Api.Ai.Services;

/// <summary>What the writer is asked for each kind of spark, whichever provider writes it.</summary>
/// <param name="Instructions">What to write from the member's idea.</param>
/// <param name="ImageStyle">For kinds that come with a picture, what kind of picture; null otherwise.</param>
public sealed record SparkBrief(string Instructions, string? ImageStyle)
{
    public bool HasImage => ImageStyle is not null;
}

public static class SparkBriefs
{
    /// <summary>The ground rules every brief shares.</summary>
    public const string Rules =
        "You write short creative pieces called sparks for a social app. The member gives you an idea; " +
        "turn it into one original piece. Keep it suitable for everyone, never copy existing text, and " +
        "write only the piece itself, with no preamble or commentary.";

    /// <summary>How the visual description for a picture should read.</summary>
    public const string ImagePromptRules =
        "Also write imagePrompt: a description of a single image for an image generator, under 60 words, " +
        "rich in visual detail (subject, setting, light, colour, composition). No names of real people, " +
        "no text or lettering in the image.";

    public static SparkBrief For(SparkKind kind) => kind switch
    {
        SparkKind.MovieScript => new(
            "Write a marketable movie synopsis from the member's outline, under 180 words. Start with " +
            "\"Title: \" and the title on its own line. After each main character's name, put in " +
            "brackets an actor who would suit the role.",
            "a cinematic movie poster"),
        SparkKind.BookPlot => new(
            "Write the back-cover blurb of a novel from the member's outline, under 160 words. Start " +
            "with \"Title: \" and the title on its own line.",
            "an illustrated book cover"),
        SparkKind.Artwork => new(
            "Describe an original artwork inspired by the member's idea, under 110 words: its title, " +
            "medium, what it shows and the feeling it leaves.",
            "a fine-art piece"),
        SparkKind.Fashion => new(
            "Describe an original fashion look inspired by the member's idea, under 110 words: the " +
            "garments, materials, colours, silhouette and what inspired it.",
            "a fashion editorial photograph"),
        SparkKind.Photography => new(
            "Describe a striking photograph inspired by the member's idea, under 100 words: the " +
            "subject, setting, light, lens and mood.",
            "a photograph"),
        SparkKind.Haiku => new(
            "Write one haiku on the member's theme: three lines of five, seven and five syllables, " +
            "nothing else.",
            null),
        SparkKind.Quote => new(
            "Write one original, quotable line on the member's theme, without quotation marks or an " +
            "attribution.",
            null),
        SparkKind.Joke => new(
            "Write one short, clean, original joke about the member's topic.",
            null),
        SparkKind.Aphorism => new(
            "Write one original aphorism on the member's theme: a single short, pithy sentence stating " +
            "a general truth.",
            null),
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Regular sparks have no AI brief."),
    };
}

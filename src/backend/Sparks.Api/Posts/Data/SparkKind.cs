namespace Sparks.Api.Posts.Data;

/// <summary>
/// What kind of spark a post is: written by hand, or drafted with one of the
/// AI generators. Stored by name, and the database only accepts these names.
/// </summary>
public enum SparkKind
{
    Regular,
    MovieScript,
    BookPlot,
    Artwork,
    Fashion,
    Photography,
    Haiku,
    Quote,
    Joke,
    Aphorism,
}

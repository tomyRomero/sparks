using System.Buffers.Binary;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using Sparks.Api.Ai.Services;

namespace Sparks.Api.Ai.Providers;

/// <summary>
/// Paints a soft gradient whose colours come from the prompt, for running
/// without an image key. The same prompt always gives the same picture, and
/// the whole upload-and-attach flow runs exactly as it does with a real
/// provider. It writes the PNG itself, so it needs no imaging library.
/// </summary>
public sealed class SampleImageGenerator : IImageGenerator
{
    private const int Size = 512;

    public Task<byte[]> GenerateAsync(string prompt, CancellationToken ct)
    {
        var seed = SHA256.HashData(Encoding.UTF8.GetBytes(prompt));
        var from = (R: seed[0], G: seed[1], B: seed[2]);
        var to = (R: seed[3], G: seed[4], B: seed[5]);
        var glowX = Size * (0.25 + (seed[6] / 512.0));
        var glowY = Size * (0.25 + (seed[7] / 512.0));

        // One filter byte (0, none) before each row of RGB pixels.
        var rowLength = 1 + (Size * 3);
        var pixels = new byte[Size * rowLength];
        for (var y = 0; y < Size; y++)
        {
            var row = y * rowLength;
            for (var x = 0; x < Size; x++)
            {
                // A diagonal blend from one colour to the other, lifted by a
                // soft glow around a point the prompt picks.
                var t = (x + y) / (2.0 * (Size - 1));
                var distance = Math.Sqrt(((x - glowX) * (x - glowX)) + ((y - glowY) * (y - glowY))) / Size;
                var glow = Math.Max(0, 0.45 - distance) * 1.6;
                var pixel = row + 1 + (x * 3);
                pixels[pixel] = Blend(from.R, to.R, t, glow);
                pixels[pixel + 1] = Blend(from.G, to.G, t, glow);
                pixels[pixel + 2] = Blend(from.B, to.B, t, glow);
            }
        }

        return Task.FromResult(Png(pixels));
    }

    private static byte Blend(byte from, byte to, double t, double glow)
    {
        var value = from + ((to - from) * t);
        return (byte)Math.Clamp(value + ((255 - value) * glow), 0, 255);
    }

    /// <summary>An 8-bit RGB PNG: the signature, then the IHDR, IDAT and IEND chunks.</summary>
    private static byte[] Png(byte[] pixels)
    {
        using var png = new MemoryStream();
        png.Write([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

        var header = new byte[13];
        BinaryPrimitives.WriteInt32BigEndian(header, Size);
        BinaryPrimitives.WriteInt32BigEndian(header.AsSpan(4), Size);
        header[8] = 8; // bits per channel
        header[9] = 2; // colour type: RGB
        WriteChunk(png, "IHDR", header);

        using (var compressed = new MemoryStream())
        {
            using (var zlib = new ZLibStream(compressed, CompressionLevel.Optimal, leaveOpen: true))
            {
                zlib.Write(pixels);
            }

            WriteChunk(png, "IDAT", compressed.ToArray());
        }

        WriteChunk(png, "IEND", []);
        return png.ToArray();
    }

    private static void WriteChunk(Stream png, string type, byte[] data)
    {
        Span<byte> number = stackalloc byte[4];
        BinaryPrimitives.WriteInt32BigEndian(number, data.Length);
        png.Write(number);

        var typeBytes = Encoding.ASCII.GetBytes(type);
        png.Write(typeBytes);
        png.Write(data);

        BinaryPrimitives.WriteUInt32BigEndian(number, Crc32.Of(typeBytes, data));
        png.Write(number);
    }

    /// <summary>The CRC-32 PNG chunks end with (the same one zip uses).</summary>
    private static class Crc32
    {
        private static readonly uint[] Table = Enumerable.Range(0, 256).Select(n =>
        {
            var c = (uint)n;
            for (var k = 0; k < 8; k++)
            {
                c = (c & 1) != 0 ? 0xEDB88320 ^ (c >> 1) : c >> 1;
            }

            return c;
        }).ToArray();

        public static uint Of(byte[] first, byte[] second)
        {
            var crc = 0xFFFFFFFF;
            foreach (var b in first)
            {
                crc = Table[(crc ^ b) & 0xFF] ^ (crc >> 8);
            }

            foreach (var b in second)
            {
                crc = Table[(crc ^ b) & 0xFF] ^ (crc >> 8);
            }

            return crc ^ 0xFFFFFFFF;
        }
    }
}

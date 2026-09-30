using System.Globalization;
using Microsoft.AspNetCore.SignalR;

namespace Sparks.Api.Realtime;

public static class RealtimeExtensions
{
    /// <summary>The connections of one member, in every tab they have open.</summary>
    public static IRealtimeClient Member(this IHubClients<IRealtimeClient> clients, long userId) =>
        clients.User(userId.ToString(CultureInfo.InvariantCulture));

    /// <summary>The connections of several members at once.</summary>
    public static IRealtimeClient Members(this IHubClients<IRealtimeClient> clients, params long[] userIds) =>
        clients.Users(userIds.Select(id => id.ToString(CultureInfo.InvariantCulture)).ToList());
}

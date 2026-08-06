using DocTick.Api.Endpoints;
using Xunit;

namespace DocTick.Api.Tests;

// Doktor puan ortalaması hesabı: DbContext'siz, saf statik.
public class RatingSummaryTests
{
    [Fact]
    public void BosKume_SayacSifirOrtalamaNull()
    {
        var (average, count) = RatingSummary.From([]);
        Assert.Null(average);
        Assert.Equal(0, count);
    }

    [Fact]
    public void IkiPuan_OrtalamaDogru()
    {
        var (average, count) = RatingSummary.From([5, 4]);
        Assert.Equal(4.5, average);
        Assert.Equal(2, count);
    }

    [Fact]
    public void UcPuan_TekOndalikaYuvarlanir()
    {
        // Ham değer 4.333... → 4.3
        var (average, count) = RatingSummary.From([5, 4, 4]);
        Assert.Equal(4.3, average);
        Assert.Equal(3, count);
    }

    [Fact]
    public void TekEleman_UnVirgulSifirVeSayacBir()
    {
        var (average, count) = RatingSummary.From([3]);
        Assert.Equal(3.0, average);
        Assert.Equal(1, count);
    }
}

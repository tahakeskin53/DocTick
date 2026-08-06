using DocTick.Api.Endpoints;
using DocTick.Api.Models;
using Xunit;

namespace DocTick.Api.Tests;

// İletişim yanıtı doğrulama kuralı: DbContext'siz, saf statik (DoctorRemoval deseniyle aynı).
public class ContactReplyTests
{
    private static ContactMessage NewMsg() => new() { Subject = "Konu", Body = "Mesaj" };

    [Fact]
    public void BosYanit_Reddedilir() =>
        Assert.Equal("Yanıt boş olamaz.", ContactMessages.ValidateReply(NewMsg(), ""));

    [Fact]
    public void SadeceBoslukYanit_Reddedilir() =>
        Assert.Equal("Yanıt boş olamaz.", ContactMessages.ValidateReply(NewMsg(), "   "));

    [Fact]
    public void CokUzunYanit_Reddedilir() =>
        Assert.Equal("Yanıt en fazla 2000 karakter olabilir.", ContactMessages.ValidateReply(NewMsg(), new string('a', 2001)));

    [Fact]
    public void Tam2000Karakter_KabulEdilir() =>
        Assert.Null(ContactMessages.ValidateReply(NewMsg(), new string('a', 2000)));

    [Fact]
    public void ZatenYanitlanmisMesaj_Reddedilir()
    {
        var msg = NewMsg();
        msg.RepliedAt = DateTime.Now;
        Assert.Equal("Bu mesaj zaten yanıtlanmış.", ContactMessages.ValidateReply(msg, "Yanıtım"));
    }

    [Fact]
    public void GecerliYanit_NullDoner() =>
        Assert.Null(ContactMessages.ValidateReply(NewMsg(), "Merhaba, teşekkürler."));
}

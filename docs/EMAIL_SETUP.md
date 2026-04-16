# Email Odesílání - Nastavení SMTP

Aplikace GraveCare nyní podporuje odesílání emailů pro obnovu hesla. Zde je návod jak to nastavit.

## Rychlý Start

### 1. Nakopírujte `.env.example` na `.env`
```bash
cp .env.example .env
```

### 2. Vyplňte SMTP údaje z vašeho poskytovatele
Upravte tyto řádky v `.env`:
```env
MAIL_SERVER=smtp.your-provider.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=your-smtp-password
MAIL_DEFAULT_SENDER=noreply@domain.com
```

### 3. Restartujte aplikaci
```bash
# Vynuťte reload (pokud máte hot-reload vypnutý)
```

## Konfigurace pro Populární Poskytovatele

### Gmail
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
```

**DŮLEŽITÉ**: Musíte vytvořit "App Password" místo používání běžného hesla:
1. Přejděte na https://myaccount.google.com/apppasswords
2. Vyberte Gmail a Device (Windows/Mac/Linux)
3. Zkopírujte vygenerované heslo do `.env` jako `MAIL_PASSWORD`

### Hetzner
```env
MAIL_SERVER=smtp.hetzner.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=your-smtp-password
MAIL_DEFAULT_SENDER=your-email@domain.com
```

### Coolhosting.cz / Nazwa.pl / Wedos
```env
MAIL_SERVER=smtp.your-provider.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=your-smtp-password
MAIL_DEFAULT_SENDER=your-email@domain.com
```

Kontaktujte vašeho poskytovatele pro přesné SMTP údaje.

### O2/Vodafone/atd. (České poskytovatele)
Kontaktujte zákaznickou podporu vašeho poskytovatele a požádejte o SMTP údaje.

## Testování Email Odesílání

### Opce 1: S SMTP (produkční způsob)
1. Vyplňte SMTP údaje v `.env`
2. Přejděte na login stránku
3. Klikněte "Zapomenuté heslo?"
4. Zadejte svůj e-mail
5. Měli byste obdržet email s reset linkem

### Opce 2: Debug endpoint (bez SMTP)
Pokud nechcete konfigurovat SMTP, můžete pro vývoj použít debug endpoint:

```bash
# Získejte reset token pro e-mail
curl http://localhost:5000/api/auth/debug/reset-token/user@example.com
```

Odpověď bude obsahovat `reset_url` s tokenem, který můžete otevřít v browseru.

## Email Šablony

Email šablony jsou uloženy v `app/services/email_service.py`. Obsahují HTML a plain text verzi.

Pokud chcete upravit vzhled emailu:
1. Otevřete `app/services/email_service.py`
2. Upravte HTML v `send_password_reset_email()` funkci
3. Restartujte aplikaci

## Odstraňování Problémů

### "Connection refused" nebo timeout
- Zkontrolujte `MAIL_SERVER` a `MAIL_PORT`
- Ověřte, že máte internet připojení
- Zkontrolujte firewall nastavení

### "Authentication failed"
- Ověřte `MAIL_USERNAME` a `MAIL_PASSWORD`
- U Gmailu zkontrolujte, že používáte App Password, ne běžné heslo
- Zkontrolujte, jestli je e-mail aktivní

### Email nepřichází
- Zkontrolujte složku spam/junk
- Ověřte, že `MAIL_DEFAULT_SENDER` je platný e-mail
- Zkontrolujte server logs pro chyby (`MAIL_SERVER` logs)

## Security Notes

- ✅ Hesla se odesílají přes TLS/SSL (pokud `MAIL_USE_TLS=true`)
- ✅ Email a heslo se ukládá v `.env` (zvažte file permissions)
- ✅ Nikdy commitujte `.env` do verzovacího systému!
- ⚠️ V production používejte silná hesla a bezpečný server

## Dokumentace

Podrobná dokumentace je v [docs/PASSWORD_RESET.md](../docs/PASSWORD_RESET.md)

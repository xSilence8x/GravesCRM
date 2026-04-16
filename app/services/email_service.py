"""Email service for sending password reset and other emails"""
from flask import render_template_string, current_app
from flask_mail import Message
from app.extensions import mail


def send_password_reset_email(user_email: str, reset_token: str) -> bool:
    """
    Send password reset email to user
    
    Args:
        user_email: User's email address
        reset_token: Password reset token
        
    Returns:
        True if email was sent successfully, False otherwise
    """
    try:
        frontend_url = current_app.config.get("FRONTEND_BASE_URL", "http://localhost:5173")
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        
        # HTML email template
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c5aa0;">Obnovení hesla</h2>
                    
                    <p>Obdrželi jste tento e-mail, protože jste požádali o obnovení hesla ke svému účtu GraveCare.</p>
                    
                    <p>Chcete-li resetovat své heslo, klikněte na odkaz níže:</p>
                    
                    <p style="margin: 20px 0;">
                        <a href="{reset_url}" 
                           style="background-color: #2c5aa0; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 4px; display: inline-block;">
                            Resetovat heslo
                        </a>
                    </p>
                    
                    <p style="color: #666; font-size: 12px;">
                        Nebo zkopírujte a vložte tento odkaz do svého prohlížeče:<br>
                        <code style="background-color: #f5f5f5; padding: 10px; display: block; margin: 10px 0;">
                            {reset_url}
                        </code>
                    </p>
                    
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        Odkaz je platný 1 hodinu.<br>
                        Pokud jste o resetování hesla nežádali, ignorujte tento e-mail.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
                    
                    <p style="color: #999; font-size: 11px;">
                        GraveCare | Správa hrobů a údržby
                    </p>
                </div>
            </body>
        </html>
        """
        
        # Plain text fallback
        text_body = f"""
        Obnovení hesla
        
        Obdrželi jste tento e-mail, protože jste požádali o obnovení hesla ke svému účtu GraveCare.
        
        Resetujte své heslo zde:
        {reset_url}
        
        Odkaz je platný 1 hodinu.
        
        Pokud jste o resetování hesla nežádali, ignorujte tento e-mail.
        """
        
        msg = Message(
            subject="Obnovění hesla pro GraveCare",
            recipients=[user_email],
            html=html_body,
            body=text_body
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        current_app.logger.error(f"Chyba při odesílání e-mailu pro {user_email}: {str(e)}")
        return False


def send_welcome_email(user_email: str, nickname: str) -> bool:
    """
    Send welcome email to new user
    
    Args:
        user_email: User's email address
        nickname: User's nickname
        
    Returns:
        True if email was sent successfully, False otherwise
    """
    try:
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c5aa0;">Vítejte v GraveCare!</h2>
                    
                    <p>Ahoj {nickname}!</p>
                    
                    <p>Váš účet byl úspěšně vytvořen. Nyní se můžete přihlásit a začít spravovat své hroby a údržbu.</p>
                    
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        Pokud máte jakékoliv otázky, kontaktujte nás.
                    </p>
                </div>
            </body>
        </html>
        """
        
        text_body = f"""
        Vítejte v GraveCare!
        
        Ahoj {nickname}!
        
        Váš účet byl úspěšně vytvořen. Nyní se můžete přihlásit a začít spravovat své hroby a údržbu.
        """
        
        msg = Message(
            subject="Vítejte v GraveCare",
            recipients=[user_email],
            html=html_body,
            body=text_body
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        current_app.logger.error(f"Chyba při odesílání e-mailu: {str(e)}")
        return False

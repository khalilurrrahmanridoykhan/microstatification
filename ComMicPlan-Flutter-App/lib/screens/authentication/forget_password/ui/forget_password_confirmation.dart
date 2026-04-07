import 'package:flutter/material.dart';
import 'package:gmgi_project/screens/authentication/forget_password/ui/passwordReset/ui/forget_password_reset.dart';
import 'package:gmgi_project/theme/colors/colors.dart';

class ForgetPasswordConfirmation extends StatelessWidget {
  const ForgetPasswordConfirmation({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: ForgetPasswordScreenColors().backgroundColor,
        body: SingleChildScrollView(
          scrollDirection: Axis.vertical,
          child: Padding(
            padding: const EdgeInsets.only(right: 25, left: 25),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.asset('assets/images/image.png', height: 198, width: 198),
                SizedBox(height: 20),
                Text(
                  'Your request has been received. If the email address you entered corresponds to an account on this service, a message has been sent with password reset instructions. If you do not receive an email, your account might be registered under a different address, or you might have entered your address incorrectly.',
                  maxLines: 15,
                  style: TextStyle(color: Colors.white, fontSize: 17),
                ),
                SizedBox(height: 20),
                FilledButton(
                  style: ButtonStyle(
                    shape: WidgetStateProperty.all(
                      RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    backgroundColor: WidgetStateProperty.all(
                      LogInScreenColors().loginButtonColor,
                    ),
                  ),
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context)=>ForgetPasswordReset()));
                  },
                  child: Text('Resend', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

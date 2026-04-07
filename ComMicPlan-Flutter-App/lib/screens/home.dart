import 'package:flutter/material.dart';
import 'package:gmgi_project/screens/follow_up/userHome/ui/userHome.dart';
import 'package:gmgi_project/screens/form_only/userHome/ui/userHome.dart';
import 'package:gmgi_project/theme/colors/colors.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final buttonColor = LogInScreenColors().loginButtonColor;

    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        body: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo or Icon
                Text(
                  "Welcome to ComMicPlan",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 50),

                // Normal Data Collection Button
                _buildGradientButton(
                  context: context,
                  label: "Regular Data Collection",
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => UserHome()),
                    );
                  },
                  gradientColors: [buttonColor.withOpacity(0.8), buttonColor],
                  icon: Icons.note_alt_outlined,
                ),
                const SizedBox(height: 20),

                // Follow Up Data Collection Button
                _buildGradientButton(
                  context: context,
                  label: "Follow Up Data Collection",
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => FollowUpUserHome(),
                      ),
                    );
                  },
                  gradientColors: [buttonColor.withOpacity(0.8), buttonColor],
                  icon: Icons.follow_the_signs_outlined,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGradientButton({
    required BuildContext context,
    required String label,
    required VoidCallback onPressed,
    required List<Color> gradientColors,
    IconData? icon,
  }) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: double.infinity,
        height: 60,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradientColors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black26,
              blurRadius: 8,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, color: Colors.white),
              SizedBox(width: 10),
            ],
            Text(
              label,
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text_styles.dart';
import '../../services/auth_service.dart';
import '../../services/user_preferences_service.dart';

/// Me Tab - Profile and preferences
class MeTab extends StatelessWidget {
  const MeTab({super.key});

  void _showSignOutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              final auth = context.read<AuthService>();
              final prefs = context.read<UserPreferencesService>();
              await prefs.resetOnboarding();
              await auth.signOut();
            },
            style: TextButton.styleFrom(
              foregroundColor: AppColors.error,
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Text(
                  'Profile',
                  style: AppTextStyles.titleLarge,
                ),
              ),

              // Profile Section
              Consumer2<AuthService, UserPreferencesService>(
                builder: (context, auth, prefs, _) {
                  return Column(
                    children: [
                      CircleAvatar(
                        radius: 50,
                        backgroundColor: AppColors.primary,
                        backgroundImage: auth.photoUrl != null
                            ? NetworkImage(auth.photoUrl!)
                            : null,
                        child: auth.photoUrl == null
                            ? const Icon(
                                Icons.person,
                                size: 50,
                                color: Colors.white,
                              )
                            : null,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        auth.displayName ??
                            prefs.preferences.name ??
                            'Chef User',
                        style: AppTextStyles.titleMedium,
                      ),
                      if (auth.userEmail != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          auth.userEmail!,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ],
                      const SizedBox(height: 4),
                      Text(
                        'Free Plan',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  );
                },
              ),

              const SizedBox(height: 24),

              // Preferences Section
              _SectionHeader(title: 'Preferences'),
              
              _SettingsTile(
                icon: Icons.restaurant_menu,
                title: 'Dietary Needs',
                subtitle: 'Manage your dietary restrictions',
                onTap: () {
                  // Navigate to dietary needs
                },
              ),
              
              _SettingsTile(
                icon: Icons.public,
                title: 'Cuisine Preferences',
                subtitle: 'Select your favorite cuisines',
                onTap: () {
                  // Navigate to cuisine preferences
                },
              ),
              
              _SettingsTile(
                icon: Icons.access_time,
                title: 'Time & Skill',
                subtitle: 'Update your cooking profile',
                onTap: () {
                  // Navigate to time & skill
                },
              ),

              const Divider(height: 32),

              // Subscription Section
              _SectionHeader(title: 'Subscription'),
              
              Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.star,
                            color: AppColors.warning,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'ChefWise Pro',
                            style: AppTextStyles.titleSmall,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Unlock unlimited recipes, advanced meal planning, and more!',
                        style: AppTextStyles.bodyMedium,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          // Navigate to subscription
                        },
                        child: const Text('Upgrade to Pro'),
                      ),
                    ],
                  ),
                ),
              ),

              const Divider(height: 32),

              // Settings Section
              _SectionHeader(title: 'Settings'),
              
              _SettingsTile(
                icon: Icons.notifications,
                title: 'Notifications',
                subtitle: 'Manage notification preferences',
                onTap: () {
                  // Navigate to notifications
                },
              ),
              
              _SettingsTile(
                icon: Icons.help_outline,
                title: 'Help & Support',
                subtitle: 'Get help or contact support',
                onTap: () {
                  // Navigate to help
                },
              ),
              
              _SettingsTile(
                icon: Icons.info_outline,
                title: 'About',
                subtitle: 'Version 1.0.0',
                onTap: () {
                  // Navigate to about
                },
              ),

              const SizedBox(height: 16),

              // Sign Out Button
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: OutlinedButton(
                  onPressed: () => _showSignOutDialog(context),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 50),
                    side: const BorderSide(color: AppColors.error),
                    foregroundColor: AppColors.error,
                  ),
                  child: const Text('Sign Out'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Text(
        title,
        style: AppTextStyles.titleSmall.copyWith(
          color: AppColors.primary,
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: AppColors.primary),
      ),
      title: Text(title, style: AppTextStyles.bodyLarge),
      subtitle: Text(subtitle, style: AppTextStyles.bodySmall),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textTertiary),
      onTap: onTap,
    );
  }
}

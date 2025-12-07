import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/user_preferences_service.dart';
import 'services/pantry_service.dart';
import 'services/meal_plan_service.dart';
import 'theme/app_theme.dart';
import 'screens/onboarding/welcome_screen.dart';
import 'screens/onboarding/select_goals_screen.dart';
import 'screens/onboarding/dietary_needs_screen.dart';
import 'screens/onboarding/cooking_confidence_screen.dart';
import 'screens/home/home_tab.dart';
import 'screens/pantry/pantry_tab.dart';
import 'screens/plan/plan_tab.dart';
import 'screens/me/me_tab.dart';

void main() {
  runApp(const ChefWiseApp());
}

class ChefWiseApp extends StatelessWidget {
  const ChefWiseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => UserPreferencesService()),
        ChangeNotifierProvider(create: (_) => PantryService()),
        ChangeNotifierProvider(create: (_) => MealPlanService()),
      ],
      child: MaterialApp(
        title: 'ChefWise',
        theme: AppTheme.lightTheme,
        debugShowCheckedModeBanner: false,
        home: const AppNavigator(),
      ),
    );
  }
}

/// Main app navigator that handles onboarding and main navigation
class AppNavigator extends StatelessWidget {
  const AppNavigator({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<UserPreferencesService>(
      builder: (context, prefs, _) {
        if (prefs.isLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (!prefs.hasCompletedOnboarding) {
          return const OnboardingFlow();
        }

        return const MainScreen();
      },
    );
  }
}

/// Onboarding flow navigator
class OnboardingFlow extends StatefulWidget {
  const OnboardingFlow({super.key});

  @override
  State<OnboardingFlow> createState() => _OnboardingFlowState();
}

class _OnboardingFlowState extends State<OnboardingFlow> {
  int _currentStep = 0;

  @override
  Widget build(BuildContext context) {
    final prefsService = context.read<UserPreferencesService>();
    final prefs = prefsService.preferences;

    switch (_currentStep) {
      case 0:
        return WelcomeScreen(
          onGetStarted: () {
            setState(() {
              _currentStep = 1;
            });
          },
        );
      case 1:
        return SelectGoalsScreen(
          initialGoals: prefs.goals,
          onContinue: (goals) async {
            await prefsService.updateGoals(goals);
            setState(() {
              _currentStep = 2;
            });
          },
        );
      case 2:
        return DietaryNeedsScreen(
          initialNeeds: prefs.dietaryNeeds,
          onContinue: (needs) async {
            await prefsService.updateDietaryNeeds(needs);
            setState(() {
              _currentStep = 3;
            });
          },
        );
      case 3:
        return CookingConfidenceScreen(
          initialConfidence: prefs.cookingConfidence,
          initialCookingTime: prefs.typicalCookingTime,
          onComplete: () async {
            await prefsService.completeOnboarding();
            // Navigation will be handled automatically by AppNavigator
          },
        );
      default:
        return const SizedBox();
    }
  }
}

/// Main screen with bottom navigation
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _tabs = const [
    HomeTab(),
    PantryTab(),
    PlanTab(),
    MeTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _tabs,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.kitchen),
            label: 'Pantry',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today),
            label: 'Plan',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Me',
          ),
        ],
      ),
    );
  }
}

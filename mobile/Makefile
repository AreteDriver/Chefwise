# ChefWise Mobile - Build Commands
# Run 'make help' for available commands

.PHONY: help setup deps clean build run test lint format ios android release-ios release-android

BUNDLE_ID ?= com.chefwise.app

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================
# Setup
# ============================================

setup: ## Initial setup (run on Mac)
	@chmod +x scripts/setup-ios.sh
	@BUNDLE_ID=$(BUNDLE_ID) scripts/setup-ios.sh

setup-platforms: ## Generate iOS/Android platform files
	flutter create . --platforms=ios,android

deps: ## Install Flutter dependencies
	flutter pub get

deps-ios: deps ## Install iOS dependencies (CocoaPods)
	cd ios && pod install

deps-upgrade: ## Upgrade dependencies
	flutter pub upgrade

# ============================================
# Development
# ============================================

run: ## Run on connected device/simulator
	flutter run

run-ios: ## Run on iOS simulator
	flutter run -d ios

run-android: ## Run on Android emulator
	flutter run -d android

run-debug: ## Run with verbose logging
	flutter run --verbose

hot-restart: ## Trigger hot restart (in running app)
	@echo "Press 'R' in the terminal running 'flutter run'"

# ============================================
# Build
# ============================================

build: build-ios build-android ## Build both platforms

build-ios: ## Build iOS debug
	flutter build ios --debug

build-android: ## Build Android debug APK
	flutter build apk --debug

release-ios: ## Build iOS release (requires signing)
	flutter build ios --release

release-android: ## Build Android release APK
	flutter build apk --release

release-android-bundle: ## Build Android App Bundle (for Play Store)
	flutter build appbundle --release

# ============================================
# Testing & Quality
# ============================================

test: ## Run unit tests
	flutter test

test-coverage: ## Run tests with coverage
	flutter test --coverage

lint: ## Run Flutter analyzer
	flutter analyze

format: ## Format Dart code
	dart format lib/

format-check: ## Check formatting without changing
	dart format --set-exit-if-changed lib/

# ============================================
# Cleaning
# ============================================

clean: ## Clean build artifacts
	flutter clean

clean-ios: ## Clean iOS build
	cd ios && rm -rf Pods Podfile.lock
	cd ios && rm -rf .symlinks
	cd ios && rm -rf Flutter/Flutter.framework
	cd ios && rm -rf Flutter/Flutter.podspec

clean-all: clean clean-ios ## Deep clean everything
	rm -rf .dart_tool
	rm -rf build

# ============================================
# Xcode
# ============================================

xcode: ## Open iOS project in Xcode
	open ios/Runner.xcworkspace

xcode-clean: ## Clean Xcode derived data
	rm -rf ~/Library/Developer/Xcode/DerivedData/Runner-*

# ============================================
# Firebase
# ============================================

firebase-check: ## Check Firebase config files
	@echo "Checking Firebase configuration..."
	@test -f ios/Runner/GoogleService-Info.plist && echo "✓ iOS: GoogleService-Info.plist found" || echo "✗ iOS: GoogleService-Info.plist MISSING"
	@test -f android/app/google-services.json && echo "✓ Android: google-services.json found" || echo "✗ Android: google-services.json MISSING"

# ============================================
# Info
# ============================================

doctor: ## Run Flutter doctor
	flutter doctor -v

devices: ## List connected devices
	flutter devices

version: ## Show Flutter version
	flutter --version

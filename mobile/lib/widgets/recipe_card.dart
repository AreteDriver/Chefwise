import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../models/recipe.dart';

/// Reusable recipe card widget for both private and community recipes.
///
/// Supports:
/// - Recipe image with fallback
/// - Title and description
/// - Time, calories, servings info
/// - Macro badges (protein, carbs, fat)
/// - Tags
/// - Community features (author, rating, save button)
class RecipeCard extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback? onTap;
  final VoidCallback? onSave;
  final bool isSaved;
  final bool showAuthor;
  final String? authorName;
  final String? authorPhotoUrl;
  final double? rating;
  final int? ratingCount;
  final bool isCompact;

  const RecipeCard({
    super.key,
    required this.recipe,
    this.onTap,
    this.onSave,
    this.isSaved = false,
    this.showAuthor = false,
    this.authorName,
    this.authorPhotoUrl,
    this.rating,
    this.ratingCount,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        child: isCompact ? _buildCompactLayout() : _buildFullLayout(),
      ),
    );
  }

  Widget _buildFullLayout() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Image section with save button overlay
        Stack(
          children: [
            _buildImage(height: 180),
            if (onSave != null)
              Positioned(
                top: 8,
                right: 8,
                child: _buildSaveButton(),
              ),
            if (rating != null)
              Positioned(
                bottom: 8,
                left: 8,
                child: _buildRatingBadge(),
              ),
          ],
        ),

        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Author row (for community recipes)
              if (showAuthor && authorName != null) ...[
                _buildAuthorRow(),
                const SizedBox(height: 8),
              ],

              // Title
              Text(
                recipe.title,
                style: AppTextStyles.titleSmall,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              const SizedBox(height: 8),

              // Description
              if (recipe.description.isNotEmpty)
                Text(
                  recipe.description,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

              const SizedBox(height: 12),

              // Quick info row
              _buildInfoRow(),

              const SizedBox(height: 12),

              // Macros
              _buildMacrosRow(),

              // Tags
              if (recipe.tags.isNotEmpty) ...[
                const SizedBox(height: 12),
                _buildTagsRow(),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCompactLayout() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Image
        ClipRRect(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(12),
            bottomLeft: Radius.circular(12),
          ),
          child: SizedBox(
            width: 120,
            height: 120,
            child: _buildImage(),
          ),
        ),

        // Content
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  recipe.title,
                  style: AppTextStyles.titleSmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: 4),

                // Time and calories
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 14,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${recipe.totalTime} min',
                      style: AppTextStyles.labelSmall,
                    ),
                    const SizedBox(width: 12),
                    Icon(
                      Icons.local_fire_department,
                      size: 14,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${recipe.macros.calories.toInt()} cal',
                      style: AppTextStyles.labelSmall,
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                // Rating or macros
                if (rating != null)
                  Row(
                    children: [
                      Icon(Icons.star, size: 16, color: AppColors.warning),
                      const SizedBox(width: 4),
                      Text(
                        rating!.toStringAsFixed(1),
                        style: AppTextStyles.labelSmall.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (ratingCount != null) ...[
                        const SizedBox(width: 4),
                        Text(
                          '($ratingCount)',
                          style: AppTextStyles.labelSmall.copyWith(
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ],
                    ],
                  )
                else
                  Row(
                    children: [
                      _buildMiniMacroBadge(
                        'P',
                        '${recipe.macros.protein.toInt()}g',
                        AppColors.accent,
                      ),
                      const SizedBox(width: 6),
                      _buildMiniMacroBadge(
                        'C',
                        '${recipe.macros.carbs.toInt()}g',
                        AppColors.accentSecondary,
                      ),
                      const SizedBox(width: 6),
                      _buildMiniMacroBadge(
                        'F',
                        '${recipe.macros.fat.toInt()}g',
                        AppColors.warning,
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),

        // Save button
        if (onSave != null)
          IconButton(
            icon: Icon(
              isSaved ? Icons.bookmark : Icons.bookmark_border,
              color: isSaved ? AppColors.primary : AppColors.textSecondary,
            ),
            onPressed: onSave,
          ),
      ],
    );
  }

  Widget _buildImage({double? height}) {
    if (recipe.imageUrl != null && recipe.imageUrl!.isNotEmpty) {
      return Image.network(
        recipe.imageUrl!,
        height: height,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildImagePlaceholder(height: height),
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return _buildImagePlaceholder(
            height: height,
            isLoading: true,
          );
        },
      );
    }
    return _buildImagePlaceholder(height: height);
  }

  Widget _buildImagePlaceholder({double? height, bool isLoading = false}) {
    return Container(
      height: height,
      width: double.infinity,
      color: AppColors.surfaceVariant,
      child: Center(
        child: isLoading
            ? const CircularProgressIndicator(strokeWidth: 2)
            : Icon(
                Icons.restaurant,
                size: height != null ? height * 0.35 : 40,
                color: AppColors.textTertiary,
              ),
      ),
    );
  }

  Widget _buildSaveButton() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: IconButton(
        icon: Icon(
          isSaved ? Icons.bookmark : Icons.bookmark_border,
          color: isSaved ? AppColors.primary : AppColors.textSecondary,
        ),
        onPressed: onSave,
        constraints: const BoxConstraints(
          minWidth: 40,
          minHeight: 40,
        ),
      ),
    );
  }

  Widget _buildRatingBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star, size: 16, color: AppColors.warning),
          const SizedBox(width: 4),
          Text(
            rating!.toStringAsFixed(1),
            style: AppTextStyles.labelSmall.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (ratingCount != null) ...[
            const SizedBox(width: 4),
            Text(
              '($ratingCount)',
              style: AppTextStyles.labelSmall.copyWith(
                color: Colors.white70,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAuthorRow() {
    return Row(
      children: [
        CircleAvatar(
          radius: 12,
          backgroundColor: AppColors.surfaceVariant,
          backgroundImage: authorPhotoUrl != null
              ? NetworkImage(authorPhotoUrl!)
              : null,
          child: authorPhotoUrl == null
              ? Icon(
                  Icons.person,
                  size: 14,
                  color: AppColors.textSecondary,
                )
              : null,
        ),
        const SizedBox(width: 8),
        Text(
          authorName!,
          style: AppTextStyles.labelSmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow() {
    return Row(
      children: [
        Icon(
          Icons.access_time,
          size: 16,
          color: AppColors.textSecondary,
        ),
        const SizedBox(width: 4),
        Text(
          '${recipe.totalTime} min',
          style: AppTextStyles.labelSmall,
        ),
        const SizedBox(width: 16),
        Icon(
          Icons.local_fire_department,
          size: 16,
          color: AppColors.textSecondary,
        ),
        const SizedBox(width: 4),
        Text(
          '${recipe.macros.calories.toInt()} cal',
          style: AppTextStyles.labelSmall,
        ),
        const SizedBox(width: 16),
        Icon(
          Icons.restaurant_menu,
          size: 16,
          color: AppColors.textSecondary,
        ),
        const SizedBox(width: 4),
        Text(
          '${recipe.servings} servings',
          style: AppTextStyles.labelSmall,
        ),
      ],
    );
  }

  Widget _buildMacrosRow() {
    return Row(
      children: [
        MacroBadge(
          label: 'P',
          value: '${recipe.macros.protein.toInt()}g',
          color: AppColors.accent,
        ),
        const SizedBox(width: 8),
        MacroBadge(
          label: 'C',
          value: '${recipe.macros.carbs.toInt()}g',
          color: AppColors.accentSecondary,
        ),
        const SizedBox(width: 8),
        MacroBadge(
          label: 'F',
          value: '${recipe.macros.fat.toInt()}g',
          color: AppColors.warning,
        ),
      ],
    );
  }

  Widget _buildMiniMacroBadge(String label, String value, Color color) {
    return Text(
      '$label: $value',
      style: AppTextStyles.labelSmall.copyWith(
        color: color,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  Widget _buildTagsRow() {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: recipe.tags.take(3).map((tag) {
        return Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 4,
          ),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            tag,
            style: AppTextStyles.labelSmall.copyWith(
              color: AppColors.primary,
            ),
          ),
        );
      }).toList(),
    );
  }
}

/// Macro badge widget (exposed for reuse)
class MacroBadge extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const MacroBadge({
    super.key,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: AppTextStyles.labelSmall.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 2),
          Text(
            value,
            style: AppTextStyles.labelSmall.copyWith(
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

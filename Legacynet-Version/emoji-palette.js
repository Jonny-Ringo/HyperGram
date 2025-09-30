// HyperGram Emoji Palette
// Centralized emoji definitions for reactions and future features

export const EmojiPalette = {
    // Quick reactions - most commonly used
    quick: [
        { emoji: '👍', name: 'thumbs_up', category: 'quick' },
        { emoji: '❤️', name: 'heart', category: 'quick' },
        { emoji: '😂', name: 'laugh', category: 'quick' },
        { emoji: '😮', name: 'wow', category: 'quick' },
        { emoji: '😢', name: 'sad', category: 'quick' },
        { emoji: '😡', name: 'angry', category: 'quick' },
        { emoji: '🎉', name: 'party', category: 'quick' },
        { emoji: '🔥', name: 'fire', category: 'quick' }
    ],

    // Faces & emotions
    faces: [
        // Happy
        { emoji: '😀', name: 'grinning', category: 'faces' },
        { emoji: '😁', name: 'beaming', category: 'faces' },
        { emoji: '😂', name: 'tears_of_joy', category: 'faces' },
        { emoji: '🤣', name: 'rolling_laugh', category: 'faces' },
        { emoji: '😃', name: 'grinning_big_eyes', category: 'faces' },
        { emoji: '😄', name: 'grinning_squinting_eyes', category: 'faces' },
        { emoji: '😅', name: 'grinning_sweat', category: 'faces' },
        { emoji: '😊', name: 'smiling_eyes', category: 'faces' },
        { emoji: '🙂', name: 'slightly_smiling', category: 'faces' },
        { emoji: '😉', name: 'winking', category: 'faces' },

        // Love
        { emoji: '😍', name: 'heart_eyes', category: 'faces' },
        { emoji: '🥰', name: 'smiling_hearts', category: 'faces' },
        { emoji: '😘', name: 'kiss', category: 'faces' },
        { emoji: '😗', name: 'kissing', category: 'faces' },
        { emoji: '🤗', name: 'hugging', category: 'faces' },

        // Thinking
        { emoji: '🤔', name: 'thinking', category: 'faces' },
        { emoji: '🤨', name: 'raised_eyebrow', category: 'faces' },
        { emoji: '🧐', name: 'monocle', category: 'faces' },

        // Neutral
        { emoji: '😐', name: 'neutral', category: 'faces' },
        { emoji: '😑', name: 'expressionless', category: 'faces' },
        { emoji: '🙄', name: 'eye_roll', category: 'faces' },

        // Sad
        { emoji: '😢', name: 'crying', category: 'faces' },
        { emoji: '😭', name: 'loudly_crying', category: 'faces' },
        { emoji: '😞', name: 'disappointed', category: 'faces' },
        { emoji: '😔', name: 'pensive', category: 'faces' },
        { emoji: '😟', name: 'worried', category: 'faces' },
        { emoji: '😕', name: 'slightly_frowning', category: 'faces' },

        // Angry
        { emoji: '😠', name: 'angry', category: 'faces' },
        { emoji: '😡', name: 'pouting', category: 'faces' },
        { emoji: '🤬', name: 'swearing', category: 'faces' },

        // Surprised
        { emoji: '😲', name: 'astonished', category: 'faces' },
        { emoji: '😱', name: 'screaming', category: 'faces' },
        { emoji: '😮', name: 'open_mouth', category: 'faces' },
        { emoji: '😯', name: 'hushed', category: 'faces' },

        // Other
        { emoji: '🤯', name: 'exploding_head', category: 'faces' },
        { emoji: '🥳', name: 'partying', category: 'faces' },
        { emoji: '🤪', name: 'zany', category: 'faces' },
        { emoji: '😎', name: 'sunglasses', category: 'faces' }
    ],

    // Gestures & hands
    gestures: [
        { emoji: '👍', name: 'thumbs_up', category: 'gestures' },
        { emoji: '👎', name: 'thumbs_down', category: 'gestures' },
        { emoji: '👌', name: 'ok_hand', category: 'gestures' },
        { emoji: '✌️', name: 'victory_hand', category: 'gestures' },
        { emoji: '🤞', name: 'crossed_fingers', category: 'gestures' },
        { emoji: '🤟', name: 'love_you_gesture', category: 'gestures' },
        { emoji: '🤘', name: 'sign_of_horns', category: 'gestures' },
        { emoji: '👏', name: 'clapping_hands', category: 'gestures' },
        { emoji: '🙌', name: 'raising_hands', category: 'gestures' },
        { emoji: '👋', name: 'waving_hand', category: 'gestures' },
        { emoji: '🤚', name: 'raised_back_hand', category: 'gestures' },
        { emoji: '✋', name: 'raised_hand', category: 'gestures' },
        { emoji: '🖐️', name: 'hand_splayed', category: 'gestures' },
        { emoji: '🤲', name: 'palms_up_together', category: 'gestures' },
        { emoji: '🙏', name: 'folded_hands', category: 'gestures' }
    ],

    // Hearts & symbols
    hearts: [
        { emoji: '❤️', name: 'red_heart', category: 'hearts' },
        { emoji: '🧡', name: 'orange_heart', category: 'hearts' },
        { emoji: '💛', name: 'yellow_heart', category: 'hearts' },
        { emoji: '💚', name: 'green_heart', category: 'hearts' },
        { emoji: '💙', name: 'blue_heart', category: 'hearts' },
        { emoji: '💜', name: 'purple_heart', category: 'hearts' },
        { emoji: '🤍', name: 'white_heart', category: 'hearts' },
        { emoji: '🖤', name: 'black_heart', category: 'hearts' },
        { emoji: '🤎', name: 'brown_heart', category: 'hearts' },
        { emoji: '💔', name: 'broken_heart', category: 'hearts' },
        { emoji: '❣️', name: 'heart_exclamation', category: 'hearts' },
        { emoji: '💕', name: 'two_hearts', category: 'hearts' },
        { emoji: '💞', name: 'revolving_hearts', category: 'hearts' },
        { emoji: '💓', name: 'beating_heart', category: 'hearts' },
        { emoji: '💗', name: 'growing_heart', category: 'hearts' },
        { emoji: '💖', name: 'sparkling_heart', category: 'hearts' },
        { emoji: '💘', name: 'heart_arrow', category: 'hearts' },
        { emoji: '💝', name: 'heart_ribbon', category: 'hearts' }
    ],

    // Objects & activities
    objects: [
        { emoji: '🎉', name: 'party_popper', category: 'objects' },
        { emoji: '🎊', name: 'confetti_ball', category: 'objects' },
        { emoji: '🔥', name: 'fire', category: 'objects' },
        { emoji: '⭐', name: 'star', category: 'objects' },
        { emoji: '✨', name: 'sparkles', category: 'objects' },
        { emoji: '💯', name: 'hundred_points', category: 'objects' },
        { emoji: '💢', name: 'anger_symbol', category: 'objects' },
        { emoji: '💥', name: 'collision', category: 'objects' },
        { emoji: '💫', name: 'dizzy', category: 'objects' },
        { emoji: '💦', name: 'sweat_droplets', category: 'objects' },
        { emoji: '💨', name: 'dashing_away', category: 'objects' },
        { emoji: '⚡', name: 'high_voltage', category: 'objects' },
        { emoji: '🌟', name: 'glowing_star', category: 'objects' },
        { emoji: '🎯', name: 'bullseye', category: 'objects' },
        { emoji: '🚀', name: 'rocket', category: 'objects' },
        { emoji: '🏆', name: 'trophy', category: 'objects' },
        { emoji: '🎪', name: 'circus_tent', category: 'objects' }
    ],

    // Tech & crypto themed (for HyperGram context)
    tech: [
        { emoji: '💎', name: 'gem', category: 'tech' },
        { emoji: '🔒', name: 'lock', category: 'tech' },
        { emoji: '🔓', name: 'unlock', category: 'tech' },
        { emoji: '🔑', name: 'key', category: 'tech' },
        { emoji: '💻', name: 'laptop', category: 'tech' },
        { emoji: '📱', name: 'mobile_phone', category: 'tech' },
        { emoji: '🌐', name: 'globe', category: 'tech' },
        { emoji: '📡', name: 'satellite_antenna', category: 'tech' },
        { emoji: '🛸', name: 'flying_saucer', category: 'tech' },
        { emoji: '⚡', name: 'zap', category: 'tech' },
        { emoji: '🔮', name: 'crystal_ball', category: 'tech' }
    ]
};

// Helper functions for easy access
export const EmojiUtils = {
    // Get all emojis from all categories
    getAllEmojis() {
        const all = [];
        Object.values(EmojiPalette).forEach(category => {
            if (Array.isArray(category)) {
                all.push(...category);
            }
        });
        return all;
    },

    // Get emojis by category
    getByCategory(categoryName) {
        return EmojiPalette[categoryName] || [];
    },

    // Find emoji by name
    findByName(name) {
        const all = this.getAllEmojis();
        return all.find(emoji => emoji.name === name);
    },

    // Get quick reactions (most common)
    getQuickReactions() {
        return EmojiPalette.quick;
    },

    // Create emoji picker data structure
    getPickerCategories() {
        return [
            { name: 'Quick', key: 'quick', emojis: EmojiPalette.quick },
            { name: 'Faces', key: 'faces', emojis: EmojiPalette.faces },
            { name: 'Gestures', key: 'gestures', emojis: EmojiPalette.gestures },
            { name: 'Hearts', key: 'hearts', emojis: EmojiPalette.hearts },
            { name: 'Objects', key: 'objects', emojis: EmojiPalette.objects },
            { name: 'Tech', key: 'tech', emojis: EmojiPalette.tech }
        ];
    },

    // Validate if emoji exists in our palette
    isValidEmoji(emojiChar) {
        const all = this.getAllEmojis();
        return all.some(emoji => emoji.emoji === emojiChar);
    }
};

// Export for use in other files
export default EmojiPalette;
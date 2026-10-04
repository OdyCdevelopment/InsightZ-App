import React from 'react';
import { View, Image, StyleSheet, ImageStyle, StyleProp, ViewStyle } from 'react-native';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showTagline?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  align?: 'flex-start' | 'center' | 'flex-end';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  style,
  imageStyle,
  align = 'center',
}) => {
  // Dimensions based on cropped aspect ratio (1409 / 356 ≈ 3.958)
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { width: 135, height: 34 };
      case 'md':
        return { width: 195, height: 49 };
      case 'lg':
        return { width: 270, height: 68 };
      case 'xl':
        return { width: 330, height: 83 };
      case 'hero':
        return { width: 370, height: 93 };
      default:
        return { width: 195, height: 49 };
    }
  };

  const dims = getDimensions();

  return (
    <View style={[styles.container, { alignItems: align }, style]}>
      <Image
        source={require('../../assets/insightz_logo.png')}
        style={[
          {
            width: dims.width,
            height: dims.height,
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
});

import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { NearbyScreen } from '../screens/NearbyScreen';
import { DealsScreen } from '../screens/DealsScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';

const Tab = createBottomTabNavigator<TabParamList>();

interface TabIconProps {
  focused: boolean;
  name: React.ComponentProps<typeof Ionicons>['name'];
  outlineName: React.ComponentProps<typeof Ionicons>['name'];
  hasDot?: boolean;
  dotColor?: string;
}

const TabIconItem: React.FC<TabIconProps> = ({
  focused,
  name,
  outlineName,
  hasDot,
  dotColor = '#EF4444',
}) => {
  return (
    <View style={styles.tabIconContainer}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <Ionicons
          name={focused ? name : outlineName}
          size={23}
          color={focused ? '#1D68ED' : '#8C9BAE'}
        />
        {hasDot && !focused ? (
          <View style={[styles.badgeDot, { backgroundColor: dotColor }]} />
        ) : null}
      </View>
      {focused ? <View style={styles.activeIndicatorDot} /> : <View style={styles.inactiveIndicatorPlaceholder} />}
    </View>
  );
};

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIconItem
              focused={focused}
              name="home"
              outlineName="home-outline"
            />
          ),
        }}
      />

      {/* 500m Location-Based Offers Tab (Near Me) */}
      <Tab.Screen
        name="Nearby"
        component={NearbyScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIconItem
              focused={focused}
              name="navigate"
              outlineName="navigate-outline"
              hasDot={true}
              dotColor="#1D68ED"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Deals"
        component={DealsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIconItem
              focused={focused}
              name="flash"
              outlineName="flash-outline"
              hasDot={true}
              dotColor="#EF4444"
            />
          ),
        }}
      />

      {/* Compare Tab Hidden */}
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tab.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIconItem
              focused={focused}
              name="person"
              outlineName="person-outline"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: Platform.OS === 'ios' ? 78 : 62,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: '#EFF6FF',
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1D68ED',
    marginTop: 2,
  },
  inactiveIndicatorPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 2,
  },
});

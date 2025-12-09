import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

interface LineChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }>;
  };
  width?: number;
  height?: number;
}

export const CustomLineChart: React.FC<LineChartProps> = ({
  data,
  width = screenWidth - 48,
  height = 220,
}) => {
  return (
    <View style={styles.container}>
      <LineChart
        data={data}
        width={width}
        height={height}
        chartConfig={{
          backgroundColor: '#FFFFFF',
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#6366F1',
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

interface BarChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
    }>;
  };
  width?: number;
  height?: number;
}

export const CustomBarChart: React.FC<BarChartProps> = ({
  data,
  width = screenWidth - 48,
  height = 220,
}) => {
  return (
    <View style={styles.container}>
      <BarChart
        data={data}
        width={width}
        height={height}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#FFFFFF',
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

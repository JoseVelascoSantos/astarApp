import React, {useState} from 'react';
import type {Node} from 'react';
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {Astar} from 'astar_jpgc_javs';
import Dialog from 'react-native-dialog';
import Icon from 'react-native-vector-icons/FontAwesome';

const STOP = 0;
const POINT_ALLOCATION = 1;
const OBSTACLE_ALLOCATION = 2;
const INACCESSIBLE_ALLOCATION = 3;
const RISKY_ALLOCATION = 4;
const CALCULATE = 5;

const getIcon = value => {
  switch (value) {
    case STOP:
      return 'circle-thin';
    case POINT_ALLOCATION:
      return 'map-marker';
    case OBSTACLE_ALLOCATION:
      return 'times-circle';
    case INACCESSIBLE_ALLOCATION:
      return 'database';
    case RISKY_ALLOCATION:
      return 'delicious';
    case CALCULATE:
      return 'plane';
    default:
      return 'circle-thin';
  }
};

const getColor = value => {
  switch (value) {
    case STOP:
      return '#b8b8b8';
    case POINT_ALLOCATION:
      return '#4cb44c';
    case OBSTACLE_ALLOCATION:
      return '#9c1f2c';
    case INACCESSIBLE_ALLOCATION:
      return '#ba8025';
    case RISKY_ALLOCATION:
      return '#b8b625';
    case CALCULATE:
      return '#37a3b1';
    default:
      return '#000000';
  }
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height * 0.6;

const App: () => Node = () => {
  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [maxX, setMaxX] = useState(10);
  const [maxY, setMaxY] = useState(10);
  const [astar, setAstar] = useState(new Astar(maxX, maxY, 1));
  const [state, setState] = useState(STOP);
  const [canCalculate, setCanCalculate] = useState(false);
  const [map, setMap] = useState(new Map());
  const [paths, setPaths] = useState([]);
  const [riskyDialogVisible, setRiskyDialogVisible] = useState(false);
  const [riskyValue, setRiskyValue] = useState(1);
  const [riskyPoint, setRiskyPoint] = useState();

  const iconSize =
    screenWidth / maxY < screenHeight / maxX
      ? screenWidth / maxY
      : screenHeight / maxX;

  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  const reset = () => {
    setAstar(new Astar(maxX, maxY, 1));
    setMap(new Map());
    setPaths([]);
    setState(STOP);
  };

  const calculate = () => {
    setCanCalculate(false);
    astar.calculate();
    setPaths(
      astar
        .getPaths()
        .map(path =>
          path.map(point =>
            point ? astar._getKeyFromPoint(point) : undefined,
          ),
        ),
    );
    setState(STOP);
  };

  const getIconName = (x, y) => {
    const key = astar._getKeyFromPoint({x: x, y: y});
    const pathValue = paths.find(path => path.find(_key => _key === key));
    if (map.has(key)) {
      if (map.get(key).riskyValue) {
        return map.get(key);
      }
      return getIcon(map.get(key));
    } else if (pathValue) {
      return getIcon(CALCULATE);
    } else {
      return undefined;
    }
  };

  const getIconColor = (x, y) => {
    const key = astar._getKeyFromPoint({x: x, y: y});
    const pathValue = paths.find(path => path.find(_key => _key === key));
    if (map.has(key)) {
      if (map.get(key).riskyValue) {
        if (pathValue) {
          return getColor(CALCULATE);
        } else {
          return getColor(RISKY_ALLOCATION);
        }
      }
      return getColor(map.get(key));
    } else if (pathValue) {
      return getColor(CALCULATE);
    } else {
      return getColor(undefined);
    }
  };

  const printBoard = () => {
    const value = [];

    for (let x = 0; x < maxX; x++) {
      const row = [];
      for (let y = 0; y < maxY; y++) {
        row.push(
          <TouchableOpacity
            key={astar._getKeyFromPoint({x: x, y: y})}
            style={styles.point}
            onPress={() => onCellPress(x, y)}>
            {getIconName(x, y) && !getIconName(x, y).riskyValue && (
              <Icon
                name={getIconName(x, y)}
                size={iconSize}
                color={getIconColor(x, y)}
              />
            )}

            {getIconName(x, y) && getIconName(x, y).riskyValue && (
              <Text
                style={{
                  color: getIconColor(x, y),
                  fontSize: iconSize / 2,
                  fontWeight: 'bold',
                }}>
                {getIconName(x, y).riskyValue}
              </Text>
            )}
          </TouchableOpacity>,
        );
      }
      value.push(<View key={x} style={styles.boardRow} children={row} />);
    }

    return <View style={styles.board}>{value}</View>;
  };

  const onCellPress = (x, y) => {
    const key = astar._getKeyFromPoint({x: x, y: y});
    const _map = new Map(map);

    switch (state) {
      case STOP:
        break;

      case POINT_ALLOCATION:
        if (_map.size > 0) {
          setCanCalculate(true);
        }
        _map.set(key, POINT_ALLOCATION);
        astar.addPoint(x, y);
        break;

      case OBSTACLE_ALLOCATION:
        _map.set(key, OBSTACLE_ALLOCATION);
        astar.setObstacle(x, y);
        break;

      case RISKY_ALLOCATION:
        setRiskyPoint({x: x, y: y});
        setRiskyDialogVisible(true);
        break;

      case INACCESSIBLE_ALLOCATION:
        _map.set(key, INACCESSIBLE_ALLOCATION);
        astar.setInaccessible(x, y);
        break;
    }
    setMap(_map);
  };

  return (
    <>
      <Dialog.Container visible={resetDialogVisible}>
        <Dialog.Title>Configurar tablero</Dialog.Title>
        <Dialog.Description>
          Introducir altura y anchura u omitir valor para continuar con mismas
          medidas
        </Dialog.Description>
        <Dialog.CodeInput codeLength={2} onCodeChange={setMaxX} />
        <Dialog.CodeInput codeLength={2} onCodeChange={setMaxY} />
        <Dialog.Button
          label="Aceptar"
          onPress={() => {
            reset();
            setResetDialogVisible(false);
          }}
        />
      </Dialog.Container>
      <Dialog.Container visible={riskyDialogVisible}>
        <Dialog.Title>Valor de riesgo</Dialog.Title>
        <Dialog.Description>Introducir valor de riesgo</Dialog.Description>
        <Dialog.CodeInput codeLength={2} onCodeChange={setRiskyValue} />
        <Dialog.Button
          label="Aceptar"
          onPress={() => {
            const key = astar._getKeyFromPoint(riskyPoint);
            const _map = new Map(map);
            _map.set(key, {riskyValue: riskyValue});
            astar.setRiskyPoint(riskyPoint.x, riskyPoint.y, Number(riskyValue));
            setMap(_map);
            setRiskyDialogVisible(false);
          }}
        />
      </Dialog.Container>
      <SafeAreaView style={backgroundStyle}>
        {printBoard()}
        <View style={styles.container}>
          <View style={styles.buttonsContainer}>
            <View style={styles.button}>
              <Icon.Button
                name={getIcon(POINT_ALLOCATION)}
                backgroundColor={
                  state !== POINT_ALLOCATION
                    ? getColor(POINT_ALLOCATION)
                    : getColor(STOP)
                }
                onPress={() => setState(POINT_ALLOCATION)}>
                Asignar puntos
              </Icon.Button>
            </View>
            <View style={styles.button}>
              <Icon.Button
                name={getIcon(OBSTACLE_ALLOCATION)}
                backgroundColor={
                  state !== OBSTACLE_ALLOCATION
                    ? getColor(OBSTACLE_ALLOCATION)
                    : getColor(STOP)
                }
                onPress={() => setState(OBSTACLE_ALLOCATION)}>
                Asignar obstaculos
              </Icon.Button>
            </View>
            <View style={styles.button}>
              <Icon.Button
                name={getIcon(INACCESSIBLE_ALLOCATION)}
                backgroundColor={
                  state !== INACCESSIBLE_ALLOCATION
                    ? getColor(INACCESSIBLE_ALLOCATION)
                    : getColor(STOP)
                }
                onPress={() => setState(INACCESSIBLE_ALLOCATION)}>
                Asignar puntos inaccesibles
              </Icon.Button>
            </View>
            <View style={styles.button}>
              <Icon.Button
                name={getIcon(RISKY_ALLOCATION)}
                backgroundColor={
                  state !== RISKY_ALLOCATION
                    ? getColor(RISKY_ALLOCATION)
                    : getColor(STOP)
                }
                onPress={() => setState(RISKY_ALLOCATION)}>
                Asignar puntos de riesgo
              </Icon.Button>
            </View>
            <View style={styles.button}>
              <Icon.Button
                name={getIcon(CALCULATE)}
                backgroundColor={
                  canCalculate ? getColor(CALCULATE) : getColor(STOP)
                }
                onPress={canCalculate ? calculate : () => undefined}>
                Calcular
              </Icon.Button>
            </View>
            <View style={styles.button}>
              <Icon.Button
                name="repeat"
                backgroundColor={getColor(undefined)}
                onPress={() => {
                  reset();
                  setResetDialogVisible(true);
                }}>
                Reiniciar
              </Icon.Button>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
  },

  board: {
    flex: 1,
    flexDirection: 'column',
  },

  boardRow: {
    flexDirection: 'row',
    flex: 1,
  },

  point: {
    flex: 1,
    margin: 0,
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonsContainer: {
    margin: 2,
    width: '75%',
  },

  button: {
    margin: 2,
  },
});

export default App;

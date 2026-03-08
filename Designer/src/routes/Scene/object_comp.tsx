import {
  Button,
  Box,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Select,
  VStack,
  Input,
  Text,
  Divider,
} from '@chakra-ui/react';
import * as React from 'react';
import { CompactPicker } from 'react-color';
import Vector3Input from '../../components/vector3_input';
import { SceneObjectInterface } from '../../core/hooks/useScene';
import { IsPrimitiveObject } from '../../core/misc';
import { SceneMarker } from '../../core/states/types';

type InspectorProps = {
  sceneObject: SceneObjectInterface;
  markers?: SceneMarker[];
};

export default function SceneObjectInspector({ sceneObject, markers }: InspectorProps) {
  const [hasColor, setHasColor] = React.useState(false);

  React.useEffect(() => {
    if (sceneObject && sceneObject.object) {
      setHasColor(IsPrimitiveObject(sceneObject.object));
    } else {
      setHasColor(false);
    }
  }, [sceneObject]);

  if (!sceneObject.object) return <Box p={4}><Text color="gray.500">No object selected</Text></Box>;

  return (
    <VStack spacing={4} align="stretch" p={1}>
      <Box>
        <Heading size="sm" mb={1} color="gray.300">Name</Heading>
        <Text fontSize="md" fontWeight="bold" color="white">{sceneObject.object.objectName}</Text>
        <Text fontSize="xs" color="gray.500">{sceneObject.object.objectType}</Text>
      </Box>

      <Divider borderColor="gray.700" />

      <FormControl>
        <FormLabel fontSize="sm" color="gray.400">Position</FormLabel>
        <Vector3Input
          value={sceneObject.object.position ?? [0, 0, 0]}
          onChange={sceneObject.setPosition}
        />
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm" color="gray.400">Rotation</FormLabel>
        <Vector3Input
          value={sceneObject.object.rotation ?? [0, 0, 0]}
          onChange={sceneObject.setRotation}
        />
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm" color="gray.400">Scale</FormLabel>
        <Vector3Input
          value={sceneObject.object.scale ?? [0, 0, 0]}
          onChange={sceneObject.setScale}
        />
      </FormControl>

      <Divider borderColor="gray.700" />

      {hasColor && (
        <FormControl>
          <FormLabel fontSize="sm" color="gray.400">Color</FormLabel>
          <Box p={2} bg="gray.800" borderRadius="md">
            <CompactPicker
              color={sceneObject.object.color}
              onChange={e => sceneObject.setColor(e.hex)}
            />
          </Box>
        </FormControl>
      )}

      {(markers && markers.length > 0) && (
        <FormControl>
          <FormLabel fontSize="sm" color="gray.400">AR Anchor</FormLabel>
          <Select
            size="sm"
            bg="gray.800"
            borderColor="gray.600"
            value={sceneObject.object.markerId || ''}
            onChange={(e) => sceneObject.setMarkerId(e.target.value)}
          >
            <option value="">None (Global)</option>
            {markers.map((marker) => (
              <option key={marker.id} value={marker.id}>
                {marker.name}
              </option>
            ))}
          </Select>
        </FormControl>
      )}

      <Divider borderColor="gray.700" />

      <VStack align="start" spacing={2}>
        <Checkbox
          colorScheme="blue"
          size="sm"
          isChecked={sceneObject.object.hasGravity}
          onChange={e => sceneObject.setHasGravity(e.target.checked)}
        >
          Has Gravity
        </Checkbox>
        <Checkbox
          colorScheme="blue"
          size="sm"
          isChecked={sceneObject.object.isGrabbable}
          onChange={e => sceneObject.setGrabbable(e.target.checked)}
        >
          Grabbable
        </Checkbox>
        <Checkbox
          colorScheme="blue"
          size="sm"
          isChecked={sceneObject.object.showDesc}
          onChange={e => sceneObject.setShowDesc(e.target.checked)}
        >
          Show Description
        </Checkbox>
      </VStack>

      <Button
        size="sm"
        colorScheme="red"
        variant="outline"
        onClick={sceneObject.deleteSelf}
        width="100%"
        mt={4}
      >
        Delete Object
      </Button>
    </VStack>
  );
}

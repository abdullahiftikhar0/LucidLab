import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Skeleton,
  Textarea,
  Image,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Divider,
  Icon,
  Tooltip,
  Badge,
} from '@chakra-ui/react';
import { DeleteIcon, DownloadIcon, AddIcon, SettingsIcon, EditIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useRete } from 'rete-react-render-plugin';
import { createEditor } from '../../components/logic_designer';
import { ExportedNodes } from '../../components/logic_designer/node_exporter';
import UnityViewer from '../../components/unity_viewer';
import { ToolbarProvider, useToolbar } from '../../components/unity_toolbar/useToolbarStore';
import useScene, { SceneObjectInterface } from '../../core/hooks/useScene';
import { SceneState } from '../../core/states/types';
import { ObjectTypesManagerContext } from '../experiment_root';
import SceneObjectInspector from './object_comp';

function Rete({
  sceneState,
  setSceneLogicInFirebase,
}: {
  sceneState: SceneState;
  setSceneLogicInFirebase: (nodes: ExportedNodes) => void;
}) {
  const [ref, editor] = useRete(createEditor);
  useEffect(() => {
    let asyncFunc = async () => {
      await editor?.importSceneState(sceneState.sceneLogic ?? {});
      editor?.onSceneStateChange(nodes => {
        setSceneLogicInFirebase(nodes);
      });
    };
    asyncFunc();
  }, [editor]);
  return <Box ref={ref} style={{ width: '100%', height: '100%' }} bg="gray.900"></Box>;
}

function HierarchyItem({
  obj,
  isSelected,
  onSelect
}: {
  obj: { objectName: string; objectType: string };
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Flex
      align="center"
      p={2}
      cursor="pointer"
      bg={isSelected ? 'blue.600' : 'transparent'}
      _hover={{ bg: isSelected ? 'blue.500' : 'gray.700' }}
      onClick={onSelect}
      borderRadius="md"
      mb={1}
    >
      <Box mr={3}>
        {/* Simple icon based on type */}
        <Box w={2} h={2} borderRadius="full" bg={isSelected ? 'white' : 'gray.500'} />
      </Box>
      <VStack align="start" spacing={0}>
        <Text fontSize="sm" fontWeight={isSelected ? 'bold' : 'normal'} color="white">
          {obj.objectName}
        </Text>
        <Text fontSize="xs" color={isSelected ? 'gray.200' : 'gray.500'}>
          {obj.objectType}
        </Text>
      </VStack>
    </Flex>
  );
}

function SceneContent() {
  const { sceneName, expName } = useParams();

  if (!sceneName || !expName) {
    return <Navigate to="/" />;
  }

  const sceneCore = useScene(expName, sceneName);
  const objectTypesManager = useContext(ObjectTypesManagerContext);
  const { selectedObjectName, setSelectedObject } = useToolbar();

  const [selectedObjectType, setSelectedObjectType] = useState<string>('cube');
  const [newObjectName, setNewObjectName] = useState('');

  const createObject = function () {
    if (!newObjectName) return;
    sceneCore.addObject(newObjectName, selectedObjectType);
    setNewObjectName('');
  };

  const [activeRightTab, setActiveRightTab] = useState<'inspector' | 'settings'>('inspector');
  const [isLogicOpen, setIsLogicOpen] = useState(false);
  
  const [sceneDesc, setSceneDesc] = useState(sceneCore.scene?.description || '');
  const [markerName, setMarkerName] = useState('');
  const [markerFile, setMarkerFile] = useState<File | null>(null);

  React.useEffect(() => {
    if (sceneCore.scene?.description) {
      setSceneDesc(sceneCore.scene.description);
    }
  }, [sceneCore.scene?.description]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [existingMarkers, setExistingMarkers] = useState<any[]>([]);
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);

  const fetchExistingMarkers = async () => {
    setIsLoadingMarkers(true);
    const markers = await sceneCore.listMarkers();
    setExistingMarkers(markers);
    setIsLoadingMarkers(false);
    onOpen();
  };

  const handleMarkerUpload = async () => {
    if (!markerName || !markerFile) return;
    await sceneCore.addMarker(markerName, markerFile);
    setMarkerName('');
    setMarkerFile(null);
    const fileInput = document.getElementById('markerFileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSelectExisting = (marker: any) => {
    const defaultMarkers = sceneCore.scene?.markers ?? [];
    if (defaultMarkers.some((m: any) => m.imageUrl === marker.imageUrl)) {
      onClose();
      return;
    }
    const newMarker = {
      id: `marker_${Date.now()}`,
      name: marker.name.split('.')[0] || marker.name,
      imageUrl: marker.imageUrl
    };
    sceneCore.addMarkerManual(newMarker);
    onClose();
  };

  // When an object is selected via toolbar (which calls setSelectedObject), we want to ensure the Right Sidebar shows Inspector
  useEffect(() => {
    if (selectedObjectName) {
      setActiveRightTab('inspector');
    }
  }, [selectedObjectName]);

  const selectedSceneObject = selectedObjectName ? sceneCore.getObject(selectedObjectName) : null;

  return (
    <Flex h="100vh" w="100vw" bg="gray.900" color="gray.100" overflow="hidden">
      
      {/* LEFT SIDEBAR: HIERARCHY */}
      <Box 
        w="280px" 
        bg="gray.800" 
        borderRight="1px solid" 
        borderColor="gray.700" 
        display="flex" 
        flexDirection="column"
        zIndex={10}
      >
        <Box p={4} borderBottom="1px solid" borderColor="gray.700">
          <Heading size="sm" color="white" mb={4}>Hierarchy</Heading>
          
          <VStack spacing={3}>
            <FormControl>
              <Input
                size="sm"
                value={newObjectName}
                onChange={e => setNewObjectName(e.target.value)}
                placeholder="New Object Name"
                bg="gray.900"
                border="none"
                _focus={{ boxShadow: 'outline' }}
              />
            </FormControl>
            <HStack w="100%">
              <Select
                size="sm"
                value={selectedObjectType}
                onChange={e => setSelectedObjectType(e.target.value)}
                bg="gray.900"
                border="none"
              >
                <option value="cube">Cube</option>
                <option value="sphere">Sphere</option>
                <option value="capsule">Capsule</option>
                <option value="cylinder">Cylinder</option>
                {objectTypesManager.objects.map(type => (
                  <option key={type.name} value={type.name}>{type.name}</option>
                ))}
              </Select>
              <IconButton 
                aria-label="Add Object" 
                icon={<AddIcon />} 
                size="sm" 
                colorScheme="blue"
                onClick={createObject}
                isDisabled={!newObjectName}
              />
            </HStack>
          </VStack>
        </Box>

        <Box flex={1} overflowY="auto" p={2}>
          {sceneCore.objects?.map(obj => (
            <HierarchyItem
              key={obj.objectName}
              obj={obj}
              isSelected={selectedObjectName === obj.objectName}
              onSelect={() => setSelectedObject(selectedObjectName === obj.objectName ? null : obj.objectName)}
            />
          ))}
          {(!sceneCore.objects || sceneCore.objects.length === 0) && (
            <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
              No objects in scene
            </Text>
          )}
        </Box>
      </Box>

      {/* CENTER: VIEWPORT + LOGIC */}
      <Flex flex={1} flexDirection="column" position="relative" bg="black">
        {/* UNITY VIEWPORT */}
        <Box flex={1} position="relative" overflow="hidden">
          <React.Suspense fallback={<Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center"><Skeleton height="100px" width="100px" /></Box>}>
            <UnityViewer
              style={{ width: '100%', height: '100%' }}
              expName={expName}
              sceneName={sceneName}
              sceneLogic={sceneCore.scene?.sceneLogic ?? undefined}
              objects={sceneCore.objects}
            />
          </React.Suspense>
          
          {/* LOGIC TOGGLE BUTTON */}
          <Tooltip label={isLogicOpen ? "Hide Logic Editor" : "Show Logic Editor"} placement="left">
            <Button
              position="absolute"
              bottom="20px"
              right="20px"
              colorScheme="purple"
              onClick={() => setIsLogicOpen(!isLogicOpen)}
              zIndex={100}
              leftIcon={isLogicOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
              shadow="lg"
            >
              Logic Graph
            </Button>
          </Tooltip>
        </Box>

        {/* LOGIC PANEL */}
        {isLogicOpen && (
          <Box 
            h="45%" 
            bg="gray.900" 
            borderTop="1px solid" 
            borderColor="gray.600" 
            position="relative"
            zIndex={50}
            boxShadow="0 -4px 20px rgba(0,0,0,0.5)"
          >
            <Flex 
              h="32px" 
              bg="gray.800" 
              borderBottom="1px solid" 
              borderColor="gray.700" 
              align="center" 
              px={4} 
              justify="space-between"
            >
              <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Visual Logic Editor</Text>
              <IconButton 
                aria-label="Close" 
                icon={<ChevronDownIcon />} 
                size="xs" 
                variant="ghost" 
                onClick={() => setIsLogicOpen(false)} 
              />
            </Flex>
            <Box h="calc(100% - 32px)" w="100%">
               <Rete
                 sceneState={sceneCore.scene}
                 setSceneLogicInFirebase={sceneCore.setSceneLogic}
               />
            </Box>
          </Box>
        )}
      </Flex>

      {/* RIGHT SIDEBAR: INSPECTOR / SETTINGS */}
      <Box 
        w="320px" 
        bg="gray.800" 
        borderLeft="1px solid" 
        borderColor="gray.700" 
        display="flex" 
        flexDirection="column"
        zIndex={10}
      >
        <Flex borderBottom="1px solid" borderColor="gray.700">
          <Button
            flex={1}
            variant="ghost"
            borderRadius={0}
            isActive={activeRightTab === 'inspector'}
            _active={{ bg: 'gray.700', borderBottom: '2px solid', borderColor: 'blue.400' }}
            onClick={() => setActiveRightTab('inspector')}
            py={6}
          >
            <VStack spacing={1}>
              <Icon as={EditIcon} />
              <Text fontSize="xs">Inspector</Text>
            </VStack>
          </Button>
          <Button
            flex={1}
            variant="ghost"
            borderRadius={0}
            isActive={activeRightTab === 'settings'}
            _active={{ bg: 'gray.700', borderBottom: '2px solid', borderColor: 'blue.400' }}
            onClick={() => setActiveRightTab('settings')}
            py={6}
          >
            <VStack spacing={1}>
              <Icon as={SettingsIcon} />
              <Text fontSize="xs">Settings</Text>
            </VStack>
          </Button>
        </Flex>

        <Box flex={1} overflowY="auto" p={0}>
          {activeRightTab === 'inspector' && (
            <Box p={4}>
              {selectedSceneObject ? (
                <SceneObjectInspector 
                  sceneObject={selectedSceneObject} 
                  markers={sceneCore.scene?.markers} 
                />
              ) : (
                <Flex direction="column" align="center" justify="center" h="200px" color="gray.500">
                  <Text>No object selected</Text>
                  <Text fontSize="sm">Select an object from the hierarchy or 3D view</Text>
                </Flex>
              )}
            </Box>
          )}

          {activeRightTab === 'settings' && (
            <VStack spacing={6} align="stretch" p={4}>
              <Box>
                <Heading size="xs" textTransform="uppercase" color="gray.500" mb={3}>Scene Description</Heading>
                <Textarea
                  value={sceneDesc}
                  onChange={e => {
                    setSceneDesc(e.target.value);
                    sceneCore.setDescription(e.target.value);
                  }}
                  bg="gray.900"
                  border="none"
                  fontSize="sm"
                  placeholder="Enter scene description..."
                  rows={4}
                />
              </Box>

              <Divider borderColor="gray.700" />

              <Box>
                <Heading size="xs" textTransform="uppercase" color="gray.500" mb={3}>AR Markers</Heading>
                <VStack spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.400">Add Marker</FormLabel>
                    <Flex gap={2}>
                      <Input
                        size="sm"
                        value={markerName}
                        onChange={e => setMarkerName(e.target.value)}
                        placeholder="Name"
                        bg="gray.900"
                        border="none"
                      />
                    </Flex>
                  </FormControl>
                  
                  <FormControl>
                    <Input
                      id="markerFileInput"
                      type="file"
                      size="sm"
                      onChange={e => setMarkerFile(e.target.files?.[0] || null)}
                      accept="image/*"
                      pt={1}
                      bg="gray.900"
                      border="none"
                    />
                  </FormControl>

                  <HStack w="100%">
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={handleMarkerUpload}
                      isDisabled={!markerName || !markerFile}
                      flex={1}
                    >
                      Upload
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchExistingMarkers}
                      flex={1}
                    >
                      Library
                    </Button>
                  </HStack>
                </VStack>

                <Box mt={4}>
                  {sceneCore.scene?.markers && sceneCore.scene.markers.length > 0 ? (
                    <Table size="sm" variant="simple" sx={{'th, td': { borderColor: 'gray.700' }}}>
                      <Thead>
                        <Tr>
                          <Th color="gray.400" p={2}>Img</Th>
                          <Th color="gray.400" p={2}>Name</Th>
                          <Th color="gray.400" p={2}></Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sceneCore.scene.markers.map((marker) => (
                          <Tr key={marker.id}>
                            <Td p={2}>
                              <Image src={marker.imageUrl} alt={marker.name} boxSize="30px" objectFit="cover" borderRadius="sm" />
                            </Td>
                            <Td p={2} fontSize="xs" color="gray.300">{marker.name}</Td>
                            <Td p={2}>
                              <IconButton
                                aria-label="Delete"
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                variant="ghost"
                                size="xs"
                                onClick={() => sceneCore.deleteMarker(marker.id)}
                              />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Text fontSize="xs" color="gray.500" textAlign="center">No markers added</Text>
                  )}
                </Box>
              </Box>
            </VStack>
          )}
        </Box>
      </Box>

      {/* MODAL FOR MARKERS */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Select Existing Marker</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoadingMarkers ? (
              <Skeleton height="200px" />
            ) : (
              <SimpleGrid columns={3} gap={4}>
                {existingMarkers.map(m => (
                  <Box
                    key={m.id}
                    border="1px solid"
                    borderColor="gray.600"
                    p={2}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => handleSelectExisting(m)}
                    _hover={{ bg: 'gray.700' }}
                  >
                    <Image src={m.imageUrl} alt={m.name} boxSize="100px" objectFit="contain" mx="auto" />
                    <Text fontSize="xs" textAlign="center" mt={1} isTruncated color="gray.300">{m.name}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} colorScheme="whiteAlpha">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}

export default function Scene() {
  return (
    <ToolbarProvider>
      <SceneContent />
    </ToolbarProvider>
  );
}

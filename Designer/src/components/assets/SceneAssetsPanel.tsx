import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon, AttachmentIcon, AddIcon } from '@chakra-ui/icons';
import * as React from 'react';
import SketchfabSearchModal from '../sketchfab/SketchfabSearchModal';
import { ObjectTypesManagerContext } from '../../routes/experiment_root';

export default function SceneAssetsPanel() {
  const objectTypesManager = React.useContext(ObjectTypesManagerContext);
  const toast = useToast();

  const [name, setName] = React.useState('');
  const [objFile, setObjFile] = React.useState<File | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(false);
  const [sketchfabOpen, setSketchfabOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const assetNames = objectTypesManager.objects.map((o) => o.name);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!objFile || !name.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Enter an asset name and choose a .glb file.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    const ok = await objectTypesManager.uploadObject(name.trim(), objFile);
    setIsLoading(false);

    if (!ok) {
      toast({
        title: 'Upload failed',
        description: 'Try again. The asset name must be unique.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    toast({
      title: 'Asset added',
      description: `${name.trim()} is now in the library.`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
    setName('');
    setObjFile(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Flex direction="column" h="100%" minH={0}>
      <Box p={4} borderBottom="1px solid" borderColor="gray.700" flexShrink={0}>
        <Button
          w="100%"
          leftIcon={<SearchIcon />}
          colorScheme="teal"
          variant="outline"
          borderColor="teal.400"
          color="teal.200"
          _hover={{ bg: 'teal.900' }}
          onClick={() => setSketchfabOpen(true)}
        >
          Search assets
        </Button>

        <SketchfabSearchModal
          isOpen={sketchfabOpen}
          onClose={() => setSketchfabOpen(false)}
          existingAssetNames={assetNames}
          onImported={() => objectTypesManager.refreshObjects()}
        />
      </Box>

      <Box flex={1} minH={0} overflowY="auto" p={4}>
        <Text
          fontSize="xs"
          textTransform="uppercase"
          color="gray.500"
          fontWeight="semibold"
          mb={3}
        >
          Upload new asset
        </Text>

        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="gray.900"
          border="1px solid"
          borderColor="gray.700"
          borderRadius="md"
          p={3}
          mb={6}
        >
          <VStack spacing={3} align="stretch">
            <FormControl>
              <FormLabel fontSize="xs" color="gray.400" mb={1}>
                Asset name
              </FormLabel>
              <Input
                size="sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Beaker_250ml"
                bg="gray.800"
                borderColor="gray.600"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" color="gray.400" mb={1}>
                3D model (.glb)
              </FormLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".glb"
                size="sm"
                display="none"
                onChange={(e) => setObjFile(e.target.files?.[0])}
              />
              <Button
                size="sm"
                w="100%"
                variant="outline"
                borderColor="gray.600"
                leftIcon={<AttachmentIcon />}
                onClick={() => fileInputRef.current?.click()}
                fontWeight="normal"
              >
                {objFile ? objFile.name : 'Choose file'}
              </Button>
            </FormControl>

            <Button
              type="submit"
              size="sm"
              colorScheme="blue"
              leftIcon={isLoading ? <Spinner size="xs" /> : <AddIcon />}
              isLoading={isLoading}
              isDisabled={!name.trim() || !objFile}
            >
              Add asset
            </Button>
          </VStack>
        </Box>

        <HStack justify="space-between" mb={3}>
          <Text
            fontSize="xs"
            textTransform="uppercase"
            color="gray.500"
            fontWeight="semibold"
          >
            Available assets
          </Text>
          <Badge colorScheme="gray" variant="subtle">
            {assetNames.length}
          </Badge>
        </HStack>

        {assetNames.length === 0 ? (
          <Box
            py={8}
            px={3}
            textAlign="center"
            border="1px dashed"
            borderColor="gray.600"
            borderRadius="md"
            bg="gray.900"
          >
            <Text fontSize="sm" color="gray.500">
              No assets yet
            </Text>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Search Sketchfab or upload a .glb file
            </Text>
          </Box>
        ) : (
          <VStack align="stretch" spacing={1}>
            {assetNames.map((assetName) => (
              <Flex
                key={assetName}
                align="center"
                gap={2}
                px={3}
                py={2}
                borderRadius="md"
                bg="gray.900"
                border="1px solid"
                borderColor="gray.700"
                _hover={{ borderColor: 'gray.500', bg: 'gray.700' }}
              >
                <Box
                  w={2}
                  h={2}
                  borderRadius="full"
                  bg="teal.400"
                  flexShrink={0}
                />
                <Text fontSize="sm" color="gray.200" noOfLines={1}>
                  {assetName}
                </Text>
              </Flex>
            ))}
          </VStack>
        )}
      </Box>
    </Flex>
  );
}

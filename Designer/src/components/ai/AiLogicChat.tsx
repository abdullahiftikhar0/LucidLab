import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import * as React from 'react';
import { sendAiAssistantMessage } from '../../api/ai';
import { ExportedNodes } from '../logic_designer/node_exporter';
import { AiChatMessage } from '../../core/states/types';

type AiLogicChatProps = {
  messages: AiChatMessage[];
  objects: { objectName: string; objectType: string }[];
  currentSceneLogic?: ExportedNodes | null;
  onPersistMessages: (messages: AiChatMessage[]) => void;
  onLogicApplied: (sceneLogic: ExportedNodes, assistantMessage: string) => void;
};

const SUGGESTIONS = [
  'What nodes detect touch between objects?',
  'When object A touches object B, hide object A.',
  'Change the SetColor node to pink (#ff69b4).',
];

function newMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function AiLogicChat({
  messages,
  objects,
  currentSceneLogic,
  onPersistMessages,
  onLogicApplied,
}: AiLogicChatProps) {
  const [draft, setDraft] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isLoading) return;

    const userMsg: AiChatMessage = {
      id: newMessageId(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    onPersistMessages(nextMessages);
    setDraft('');
    setError(null);
    setIsLoading(true);

    try {
      const apiMessages = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await sendAiAssistantMessage({
        messages: apiMessages,
        currentSceneLogic: currentSceneLogic ?? null,
        objects,
      });

      const assistantMsg: AiChatMessage = {
        id: newMessageId(),
        role: 'assistant',
        content: data.message,
        createdAt: Date.now(),
        appliedLogic: data.type === 'logic',
      };

      onPersistMessages([...nextMessages, assistantMsg]);

      if (data.type === 'logic' && data.sceneLogic) {
        onLogicApplied(data.sceneLogic, data.message);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'AI request failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasLogic = Boolean(
    currentSceneLogic && Object.keys(currentSceneLogic).length > 0,
  );

  return (
    <Flex direction="column" h="100%" minH={0} bg="gray.800">
      <Box
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor="gray.700"
        flexShrink={0}
      >
        <HStack justify="space-between" align="start" mb={1}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.100">
            Logic assistant
          </Text>
          {hasLogic && (
            <Badge colorScheme="purple" variant="subtle" fontSize="2xs">
              Graph loaded
            </Badge>
          )}
        </HStack>
        <Text fontSize="xs" color="gray.500" lineHeight="short">
          Ask about nodes, or describe behavior to build or edit scene logic.
        </Text>
      </Box>

      <Box
        ref={scrollRef}
        flex={1}
        minH={0}
        overflowY="auto"
        px={4}
        py={4}
      >
        {messages.length === 0 && !isLoading ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            minH="100%"
            py={8}
            textAlign="center"
          >
            <Text fontSize="sm" color="gray.400" mb={1}>
              Start a conversation
            </Text>
            <Text fontSize="xs" color="gray.600" maxW="280px" mb={6}>
              Questions stay in chat. Behavior requests update the logic graph
              below.
            </Text>
            <VStack spacing={2} w="100%" align="stretch">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  borderColor="gray.600"
                  color="gray.300"
                  fontWeight="normal"
                  fontSize="xs"
                  whiteSpace="normal"
                  h="auto"
                  py={2}
                  px={3}
                  textAlign="left"
                  onClick={() => {
                    setDraft(s);
                    textareaRef.current?.focus();
                  }}
                >
                  {s}
                </Button>
              ))}
            </VStack>
          </Flex>
        ) : (
          <VStack align="stretch" spacing={4}>
            {messages.map((m) => (
              <Flex
                key={m.id}
                justify={m.role === 'user' ? 'flex-end' : 'flex-start'}
              >
                <Box
                  maxW="92%"
                  bg={m.role === 'user' ? 'purple.600' : 'gray.900'}
                  borderRadius="lg"
                  px={3}
                  py={2.5}
                  border="1px solid"
                  borderColor={m.role === 'user' ? 'purple.400' : 'gray.700'}
                  boxShadow="sm"
                >
                  <HStack spacing={2} mb={1}>
                    <Text fontSize="2xs" fontWeight="semibold" color="gray.400">
                      {m.role === 'user' ? 'You' : 'Assistant'}
                    </Text>
                    {m.appliedLogic && (
                      <Badge colorScheme="green" fontSize="2xs" variant="subtle">
                        Logic updated
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="sm" color="gray.100" whiteSpace="pre-wrap">
                    {m.content}
                  </Text>
                </Box>
              </Flex>
            ))}
            {isLoading && (
              <HStack color="gray.400" fontSize="sm" pl={1}>
                <Spinner size="sm" />
                <Text>Thinking…</Text>
              </HStack>
            )}
          </VStack>
        )}
      </Box>

      {error && (
        <Box
          mx={4}
          mb={2}
          p={2}
          border="1px solid"
          borderColor="red.500"
          borderRadius="md"
          bg="red.900/30"
          flexShrink={0}
        >
          <Text fontSize="xs" color="red.200">
            {error}
          </Text>
        </Box>
      )}

      <Box
        px={3}
        py={3}
        borderTop="1px solid"
        borderColor="gray.700"
        bg="gray.900"
        flexShrink={0}
      >
        <Flex
          align="flex-end"
          gap={2}
          bg="gray.900"
          border="1px solid"
          borderColor="gray.600"
          borderRadius="lg"
          p={2}
          _focusWithin={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }}
        >
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask or describe logic… (Enter to send, Shift+Enter for newline)"
            bg="transparent"
            border="none"
            fontSize="sm"
            rows={2}
            minH="44px"
            maxH="120px"
            resize="none"
            p={1}
            _focus={{ boxShadow: 'none' }}
            isDisabled={isLoading}
            flex={1}
          />
          <IconButton
            aria-label="Send message"
            icon={<ArrowUpIcon />}
            colorScheme="purple"
            size="sm"
            borderRadius="md"
            onClick={handleSend}
            isLoading={isLoading}
            isDisabled={!draft.trim()}
            flexShrink={0}
            mb={0.5}
          />
        </Flex>
        <Text fontSize="2xs" color="gray.600" mt={2} px={1}>
          {objects.length > 0
            ? `${objects.length} scene object${objects.length === 1 ? '' : 's'} in context`
            : 'No scene objects yet'}
        </Text>
      </Box>
    </Flex>
  );
}

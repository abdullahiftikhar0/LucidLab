import { useFirestore, useFirestoreCollectionData, useFirestoreDocData } from 'reactfire';
import { setDocument } from '../../api/firestore';
import {
  getExperimentDocRef,
  getScenesCollectionRef,
} from '../states/references';

export default function useExperiment(expName: string) {
  const fsapp = useFirestore();
  const { data: experiment, status: expStatus } = useFirestoreDocData(getExperimentDocRef(fsapp, expName));
  const { data: scenes, status: scenesStatus } = useFirestoreCollectionData(
    getScenesCollectionRef(fsapp, expName),
  );

  async function createSelf() {
    await setDocument(
      `experiments/${expName}`,
      {
        name: expName,
      },
      true,
    );
  }

  async function updateExperiment(fields: { title?: string; description?: string; category?: string; thumbnailUrl?: string }) {
    await setDocument(`experiments/${expName}`, fields, true);
  }

  async function createScene(name: string) {
    await createSelf();

    const scenesList = (scenes as any[]) ?? [];
    const nextIndex = scenesList.length + 1;
    await setDocument(`experiments/${expName}/scenes/${name}`, {
      name,
      description: '',
      index: nextIndex,
    }, false);
  }

  return {
    experiment,
    scenes: (scenes as any[]) ?? [],
    loading: expStatus === 'loading' || scenesStatus === 'loading',
    createScene,
    createSelf,
    updateExperiment,
  };
}

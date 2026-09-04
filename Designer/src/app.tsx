import {
  ChakraProvider,
  ColorModeScript,
  Container,
  Skeleton,
  theme,
} from '@chakra-ui/react';
import { getFirestore } from '@firebase/firestore';
import React, { lazy } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { FirestoreProvider, useFirebaseApp } from 'reactfire';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import ExperimentRoot from './routes/experiment_root';
<<<<<<< HEAD
import Scene from './routes/Scene/scene';
import SceneManager from './routes/scene_manager';
import LoginPage from './routes/Login';
import RegisterPage from './routes/Register';
import LandingPage from './routes/Landing';
import DashboardHome from './routes/Dashboard';
import ClassroomDetail from './routes/ClassroomDetail';
import ExperimentsList from './routes/ExperimentsList';
import EvaluationPage from './routes/Evaluation';
import NotificationsPage from './routes/Notifications';
=======
const Scene = lazy(() => import('./routes/Scene/scene'));
const SceneManager = lazy(() => import('./routes/scene_manager'));
const LoginPage = lazy(() => import('./routes/Login'));
const RegisterPage = lazy(() => import('./routes/Register'));
const LandingPage = lazy(() => import('./routes/Landing'));
const DashboardHome = lazy(() => import('./routes/Dashboard'));
const ClassroomDetail = lazy(() => import('./routes/ClassroomDetail'));
const ExperimentsList = lazy(() => import('./routes/ExperimentsList'));
const EvaluationPage = lazy(() => import('./routes/Evaluation'));
>>>>>>> 17a2f29380429581ac33813284ed091d15ab252f

const router = createBrowserRouter([
  // Landing page as default
  { path: '/', element: <React.Suspense fallback={<Skeleton />}><LandingPage /></React.Suspense> },
  { path: '/login', element: <React.Suspense fallback={<Skeleton />}><LoginPage /></React.Suspense> },
  { path: '/register', element: <React.Suspense fallback={<Skeleton />}><RegisterPage /></React.Suspense> },

  // New authenticated routes
<<<<<<< HEAD
  { path: '/dashboard', element: <AuthGuard><DashboardHome /></AuthGuard> },
  { path: '/classrooms/:classroomId', element: <AuthGuard><ClassroomDetail /></AuthGuard> },
  { path: '/experiments', element: <AuthGuard><ExperimentsList /></AuthGuard> },
  { path: '/evaluation/:classroomId/:experimentId', element: <AuthGuard><EvaluationPage /></AuthGuard> },
  { path: '/notifications', element: <AuthGuard><NotificationsPage /></AuthGuard> },
=======
  { path: '/dashboard', element: <React.Suspense fallback={<Skeleton />}><AuthGuard><DashboardHome /></AuthGuard></React.Suspense> },
  { path: '/classrooms/:classroomId', element: <React.Suspense fallback={<Skeleton />}><AuthGuard><ClassroomDetail /></AuthGuard></React.Suspense> },
  { path: '/experiments', element: <React.Suspense fallback={<Skeleton />}><AuthGuard><ExperimentsList /></AuthGuard></React.Suspense> },
  { path: '/evaluation/:classroomId/:experimentId', element: <React.Suspense fallback={<Skeleton />}><AuthGuard><EvaluationPage /></AuthGuard></React.Suspense> },
>>>>>>> 17a2f29380429581ac33813284ed091d15ab252f

  // EXISTING — DO NOT TOUCH
  { path: '/experiment/:expName', element: <React.Suspense fallback={<Skeleton />}><SceneManager /></React.Suspense> },
  { path: '/experiment/:expName/scene/:sceneName', element: <React.Suspense fallback={<Skeleton />}><Scene /></React.Suspense> },
]);

export const LucidLabContext = React.createContext<{
  username: string;
}>(null!);

export default function App() {
  const firebaseApp = useFirebaseApp();
  const firestoreInstance = getFirestore(firebaseApp);

  return (
    <Container width="100vw" height="100vh">
      <AuthProvider>
        <LucidLabContext.Provider value={{ username: 'mainuser' }}>
          <FirestoreProvider sdk={firestoreInstance}>
            <ExperimentRoot>
              <ColorModeScript />
              <ChakraProvider theme={theme}>
                <React.Suspense fallback={<div className="w-screen h-screen skeleton-shimmer" />}>
                  <RouterProvider router={router} />
                </React.Suspense>
              </ChakraProvider>
            </ExperimentRoot>
          </FirestoreProvider>
        </LucidLabContext.Provider>
      </AuthProvider>
    </Container>
  );
}

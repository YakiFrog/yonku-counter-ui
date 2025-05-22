import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { Box, Button, Container, Flex, Heading, useToast } from '@chakra-ui/react';
import { DarkModeSwitch } from '../components/DarkModeSwitch';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { USDZLoader } from 'three-usdz-loader';

const USDZViewer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(true); // デフォルトでモデルが無いので、読み込み中表示を非表示にする
  const [model, setModel] = useState<string | null>(null);
  const toast = useToast();

  // Three.js関連のオブジェクトをコンポーネント内で再利用できるように参照として保持
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const loaderRef = useRef<USDZLoader | null>(null);
  const currentModelRef = useRef<any | null>(null); // 現在表示中のモデル参照

  // モデルを読み込む関数
  const loadUSDZModel = async (modelUrl: string, fileObj?: File) => {
    if (!sceneRef.current || !loaderRef.current || !modelGroupRef.current) {
      toast({
        title: "エラー",
        description: "3Dビューアーがまだ初期化されていません。",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // 読み込み中に状態をリセット
    setIsModelLoaded(false);
    
    // 既存のモデルがあれば削除
    if (currentModelRef.current) {
      currentModelRef.current.clear();
      currentModelRef.current = null;
      
      // モデルグループをクリア
      while (modelGroupRef.current.children.length > 0) {
        modelGroupRef.current.remove(modelGroupRef.current.children[0]);
      }
    }
    
    try {
      // SharedArrayBufferのサポートチェック
      if (typeof SharedArrayBuffer === 'undefined') {
        throw new Error('お使いのブラウザまたは環境はSharedArrayBufferをサポートしていません。これはUSDZファイルの読み込みに必要です。Electronアプリを再起動してください。');
      }
      
      let file: File;
      
      // ユーザーが選択したファイルオブジェクトがある場合はそれを使う
      if (fileObj) {
        file = fileObj;
      } else {
        // URLからファイルを取得する場合
        const response = await fetch(modelUrl);
        if (!response.ok) {
          throw new Error(`モデルファイルの取得に失敗しました: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        // File オブジェクトに変換
        file = new File([blob], 'model.usdz', { type: 'model/usdz' });
      }
      
      // USDZLoaderのモジュールが読み込まれるまで待機
      const usdModule = await loaderRef.current.waitForModuleLoadingCompleted();
      if (!usdModule) {
        throw new Error('USDZローダーモジュールの初期化に失敗しました。必要なWASMファイルが正しく配置されているか確認してください。');
      }
      
      // モデルをロード
      const loadedModel = await loaderRef.current.loadFile(file, modelGroupRef.current);
      currentModelRef.current = loadedModel;
      
      // モデルが読み込まれた後の処理
      const box = new THREE.Box3().setFromObject(modelGroupRef.current);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());

      // モデルの位置調整
      modelGroupRef.current.position.x = -center.x;
      modelGroupRef.current.position.y = -center.y;
      modelGroupRef.current.position.z = -center.z;

      // モデルのサイズ調整
      const scale = 5/size;
      modelGroupRef.current.scale.set(scale, scale, scale);
      
      setIsModelLoaded(true);
      
      toast({
        title: "モデルが読み込まれました",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('モデルの読み込みに失敗しました', error);
      toast({
        title: "エラー",
        description: "モデルの読み込みに失敗しました: " + error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsModelLoaded(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Three.jsの初期設定
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // シーンの作成
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // カメラの設定
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // レンダラーの設定
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    // THREE.sRGBEncodingは非推奨になったため、THREE.OutputEncodingに変更
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 環境光の追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 平行光源の追加
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // OrbitControlsの設定
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    // USDZローダーの初期化（public内のWASMバイナリファイルへのパスを指定）
    // 空のパスを渡すことで、現在のドキュメントのルートからファイルを参照
    const loader = new USDZLoader('');
    loaderRef.current = loader;
    
    // モデルを入れるためのグループを作成
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // リサイズハンドラ
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    // アニメーションループ
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    animate();

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentModelRef.current) {
        currentModelRef.current.clear();
      }
      if (containerRef.current && rendererRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [toast]);

  // ファイル選択ハンドラー
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.name.toLowerCase().endsWith('.usdz')) {
        // FileオブジェクトからパスのURLを作成
        const fileUrl = URL.createObjectURL(file);
        loadUSDZModel(fileUrl, file);
        setModel(fileUrl);
        // 入力フィールドをリセットして、同じファイルを再度選択できるようにする
        event.target.value = '';
        
        toast({
          title: 'ファイルを読み込みました',
          description: file.name,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "エラー",
          description: "選択されたファイルはUSDZ形式ではありません。",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <>
      <Head>
        <title>USDZ Viewer</title>
      </Head>
      <Container maxW="container.xl" p={0}>
        <Flex direction="column" h="100vh">
          <Box p={4} borderBottom="1px solid" borderColor="gray.200" display="flex" justifyContent="space-between" alignItems="center">
            <Heading size="md">USDZ Viewerコンポーネント</Heading>
            <DarkModeSwitch />
          </Box>
          
          <Box flex="1" ref={containerRef} position="relative">
            {!isModelLoaded && (
              <Flex 
                position="absolute" 
                top="0" 
                left="0" 
                right="0" 
                bottom="0" 
                justify="center" 
                align="center"
                bg="rgba(0,0,0,0.1)"
              >
                読み込み中...
              </Flex>
            )}
          </Box>
          
          <Box p={4} textAlign="center">
            <Flex direction={{ base: 'column', md: 'row' }} justify="center" align="center" gap={4}>
              <Button onClick={() => window.history.back()} colorScheme="teal">
                前のページに戻る
              </Button>
              
              <Button
                as="label"
                htmlFor="usdz-file-input"
                colorScheme="blue"
                cursor="pointer"
              >
                USDZファイルを選択
                <input
                  id="usdz-file-input"
                  type="file"
                  accept=".usdz"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </Button>
              

            </Flex>
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export default USDZViewer;

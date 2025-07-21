// Singleton para controlar la inicialización del chat
class ChatSingleton {
  private static instance: ChatSingleton;
  private isInitialized = false;
  private initializationPromise: Promise<any> | null = null;

  private constructor() {}

  public static getInstance(): ChatSingleton {
    if (!ChatSingleton.instance) {
      ChatSingleton.instance = new ChatSingleton();
    }
    return ChatSingleton.instance;
  }

  public async initialize(initFunction: () => Promise<any>): Promise<any> {
    if (this.isInitialized) {
      console.log('🟡 Chat already initialized via singleton');
      return null;
    }

    if (this.initializationPromise) {
      console.log('🟡 Chat initialization already in progress');
      return this.initializationPromise;
    }

    console.log('🟢 Starting chat initialization via singleton');
    this.initializationPromise = initFunction();
    
    try {
      const result = await this.initializationPromise;
      this.isInitialized = true;
      console.log('🟢 Chat initialization completed via singleton');
      return result;
    } catch (error) {
      console.log('🔴 Chat initialization failed via singleton:', error);
      this.initializationPromise = null; // Reset para permitir reintentos
      throw error;
    }
  }

  public reset() {
    this.isInitialized = false;
    this.initializationPromise = null;
    console.log('🔄 Chat singleton reset');
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

export default ChatSingleton;
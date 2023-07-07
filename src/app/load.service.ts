import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentData } from '@angular/fire/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { first } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { Developer } from './models/user/developer.model';
import { Workflow } from './models/workflow/workflow.model';
import { AIModel } from './models/workflow/ai-model.model';
import { AIModelType } from './models/workflow/ai-model-type.model';
import { Trigger } from './models/workflow/trigger.model';
import {
  BranchedStep,
  Definition,
  Sequence,
  SequentialStep,
} from 'sequential-workflow-designer';
import { TrainingData } from './models/workflow/training-data.model';
import { Key } from './models/workflow/key.model';
import { APIRequest } from './models/workflow/api-request.model';
import { Plan } from './models/workflow/plan.model';
import { Executable } from './models/workflow/executable.model';
import axios from 'axios';
import { Agent } from './models/workflow/agent.model';

export interface Dict<T> {
  [key: string]: T;
}

@Injectable({
  providedIn: 'root',
})
export class LoadService {
  defaultCoords = {
    address: {
      city: 'Los Angeles',
      country: 'United States',
      country_code: 'US',
      region: 'California',
      region_code: 'CA',
    },
    coords: {
      LONGITUDE: -118.243683,
      LATITUDE: 34.052235,
    },
  };

  constructor(
    @Inject(PLATFORM_ID) private platformID: Object,
    private router: Router,
    private auth: AngularFireAuth,
    private db: AngularFirestore,
    private functions: AngularFireFunctions,
    private storage: AngularFireStorage,
    private http: HttpClient,
    private metaService: Meta,
    private titleService: Title
  ) {
    this.activeTheme = 'dark'
  }

  themes = {
    'dark':{
      primaryColor: "#fe6f42",
      primaryHoverColor: "#f5601d",
      gridColor: "#242424",
      backgroundPrimaryColor: "#",
      backgroundSecondaryColor: "#F4F5F8"
    },
    'light':{
      primaryColor: "#1F6EF6",
      primaryHoverColor: "#1F6EF6",
      gridColor: "#dadada",
      backgroundPrimaryColor: "#fffff",
      backgroundSecondaryColor: "#F4F5F8"
    }
  }
 
  set activeTheme(value: 'light' | 'dark'){
    document.documentElement.style.setProperty('--primaryColor', `${this.themes[value].primaryColor}`);
    document.documentElement.style.setProperty('--primaryHoverColor', `${this.themes[value].primaryHoverColor}`);

    if (document.documentElement.style.getPropertyValue('--gridColor') != 'transparent'){
      document.documentElement.style.setProperty('--gridColor', `${this.themes[value].gridColor}`);
    }
//fix
    this.theme.next(value)
  }

  finishSignUp(
    email: string,
    password: string,
    callback: (result: { status: boolean; msg: string }) => any
  ) {
    this.auth
      .createUserWithEmailAndPassword(email, password)
      .then(async (user) => {
        if (user.user) {
          await this.setUserInfoInitial(user.user);
        }
        callback({ status: true, msg: 'success' });
      })
      .catch((err: Error) => {
        callback({ status: false, msg: err.message });
      });
  }

  finishSignIn(
    email: string,
    password: string,
    callback: (result: { status: boolean; msg: string }) => any
  ) {
    this.auth
      .signInWithEmailAndPassword(email, password)
      .then((user) => {
        callback({ status: true, msg: 'success' });
      })
      .catch((err: Error) => {
        console.log(err);
        callback({ status: false, msg: err.message });
      });
  }

  loadedUser = new BehaviorSubject<Developer | null>(null);
  loadedModels = new BehaviorSubject<Dict<AIModelType>>({});
  loadedTriggers = new BehaviorSubject<Dict<Trigger>>({});
  loadedTrainingData = new BehaviorSubject<Dict<TrainingData>>({});
  loadedKeys = new BehaviorSubject<Dict<Key>>({});
  loadedRequests = new BehaviorSubject<Dict<APIRequest>>({});
  loadedPlans = new BehaviorSubject<Dict<Plan>>({});
  loading = new BehaviorSubject<boolean>(false);
  loadedSources = new BehaviorSubject<Dict<Key>>({});
  theme = new BehaviorSubject<'light' | 'dark'>('light');

  finishPassReset(
    email: string,
    callback: (result: { status: boolean; msg: string }) => any
  ) {}

  openAuth(id: string) {
    this.router.navigateByUrl(`/account?mode=${id}`);
  }

  openDash(id: string) {
    this.router.navigateByUrl(`/dashboard/${id}`);
  }

  openHome() {
    this.router.navigateByUrl(`/home`);
  }

  addDays(date: Date, days: number) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + days,
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    );
  }

  get currentUser() {
    return this.auth.authState.pipe(first()).toPromise();
  }

  async signOut(callback: (result: boolean) => any) {
    try {
      await this.auth.signOut();
      localStorage.removeItem('url');
      localStorage.removeItem('name');
      localStorage.removeItem('email');
      this.openAuth('0');
      callback(true);
    } catch (error) {
      callback(false);
    }
  }

  sendTestWebhook(webhook: string, type = 0, chain = 1, network = 'ethereum') {
    this.functions
      .httpsCallable('sendTestHook')({
        webhook,
        type,
        chain,
        network,
      })
      .pipe(first())
      .subscribe(
        async (resp) => {},
        (err) => {
          console.error({ err });
        }
      );
  }

  async publishSmartUtil(data: Workflow, callback: (result?: Workflow) => any) {
    this.loading.next(true);

    try {
      let id = data.id;

      let uploadData = JSON.parse(JSON.stringify(data));

      if (uploadData.downloads > 0) {
        delete uploadData.downloads;
      }

      uploadData.needsSync = true;

      await this.db.collection(`Workflows`).doc(id).set(uploadData);
      callback(data);
    } catch (error) {
      console.log(error);
      callback(undefined);
    }
    this.loading.next(false);
  }

  async uploadImg(file: File, id: string, uid: string) {
    this.loading.next(true);
    try {
      let ref = this.storage.ref(`workflows/${id}/icon-${id}.png`);
      await ref.put(file, { cacheControl: 'no-cache' });
      let displayUrl = await ref.getDownloadURL().toPromise();

      try {
        await this.db
          .collection(`Users/${uid}/workflows`)
          .doc(id)
          .set({ displayUrl }, { merge: true });
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log('app');
    }
    this.loading.next(false);
  }

  async saveSmartUtil(data: Workflow, callback: (result?: Workflow) => any) {
    let id = data.id;

    let uid = (await this.currentUser)?.uid;
    this.loading.next(true);

    if (uid) {
      let uploadData = JSON.parse(JSON.stringify(data));
      uploadData.search_name = uploadData.name?.toLowerCase();

      if (uploadData.downloads > 0) {
        delete uploadData.downloads;
      }

      try {
        await this.db
          .collection(`Users/${uid}/workflows`)
          .doc(id)
          .set(uploadData, { merge: true });
        callback(data);
      } catch (error) {
        console.log(error);
        callback(undefined);
      }
    } else {
      callback(undefined);
    }
    this.loading.next(false);
  }

  async saveUserInfo(
    data: Developer,
    imgFile: File,
    uploadImage: boolean,
    callback: (result?: Developer) => any
  ) {
    let uid = data.id;
    let url = data.url;
    let name = data.name;
    let email = data.email;
    let search_name = name?.toLowerCase();

    if (uploadImage) {
      try {
        let ref = this.storage.ref(`users/${uid}/profile.png`);
        await ref.put(imgFile, { cacheControl: 'no-cache' });
        url = await ref.getDownloadURL().toPromise();
      } catch (error) {
        callback(undefined);
      }
    }

    let userInfo = {
      uid,
      url,
      name,
      email,
      search_name,
    };

    try {
      await this.db.collection('Users').doc(uid).set(userInfo, { merge: true });

      localStorage['url'] = url;
      localStorage['name'] = name;
      localStorage['email'] = email;

      callback(new Developer(name, uid, 0, url, email));
    } catch (error) {
      callback(undefined);
    }
  }

  async setUserInfoInitial(user: firebase.User) {
    let uid = user.uid;
    let email = user.email;

    let name = email?.split('@')[0].toUpperCase();
    let search_name = name?.toLowerCase();

    let joined = Math.floor(new Date().getTime());

    let url =
      'https://storage.googleapis.com/thred-protocol.appspot.com/resources/default_profile.png';

    let userRef = this.db.collection('Users').doc(uid);

    let data = {
      name,
      uid,
      email,
      joined,
      url,
      search_name,
    };

    return userRef.set(data);
  }

  filteredSearch: BehaviorSubject<any> = new BehaviorSubject([]);

  search(term: string) {
    console.log(term);
    let sub2 = this.db
      .collectionGroup(`workflows`, (ref) =>
        ref
          .where('search_name', '>=', term)
          .where('search_name', '<=', term + '\uf8ff')
          .limit(3)
      )
      .valueChanges()
      .subscribe((docs2) => {
        sub2.unsubscribe();
        let returnVal: any[] = [];

        (docs2 as Workflow[])?.forEach((d: Workflow) => {
          returnVal.push({
            name: d.name,
            type: 1,
            img: d.displayUrl,
            id: d.id,
          });
        });

        let sub3 = this.db
          .collectionGroup(`Users`, (ref) =>
            ref
              .where('search_name', '>=', term)
              .where('search_name', '<=', term + '\uf8ff')
              .limit(3)
          )
          .valueChanges()
          .subscribe((docs3) => {
            sub3.unsubscribe();
            (docs3 as any[])?.forEach((d: any) => {
              returnVal.push({
                name: d.name,
                type: 0,
                img: d.url,
                id: d.uid,
              });
            });
            this.filteredSearch.next(returnVal);
          });
      });
  }

  getWorkflow(
    id: string,
    callback: (result?: Workflow) => any,
    getProfiles = false
  ) {
    console.log(id);
    let sub2 = this.db
      .collectionGroup(`workflows`, (ref) => ref.where('id', '==', id))
      .valueChanges()
      .subscribe((docs2) => {
        sub2.unsubscribe();

        let docs_2 = docs2 as any[];

        let d = docs_2[0];

        if (d) {
          console.log(d);
          let util = this.syncWorkflow(d);

          if (getProfiles) {
            this.getUserInfo(d.creatorId, false, false, (result) => {
              if (result) {
                util.creatorName = result.name;
              }
              callback(util);
            });
          } else {
            callback(util);
          }
        } else {
          callback(undefined);
        }
      });
  }

  getWorkflows(ids: string[], callback: (result?: Workflow[]) => any) {
    console.log(ids);
    let sub2 = this.db
      .collectionGroup(`workflows`, (ref) => ref.where('id', 'in', ids))
      .get()
      .toPromise()
      .then((docs3) => {
        if (docs3) {
          let docs = docs3.docs.map((d) => d.data());

          console.log('HELLO');
          let result: Workflow[] = [];

          // docs.forEach((d) => {
          //   let util = this.syncWorkflow(d);
          //   util.layout = this.sampleFlow
          //   console.log(util)

          //   result.push(util);
          // });

          callback(result);
        }
      });
  }

  getModels(callback: (result: Dict<AIModelType>) => any) {
    try {
      this.db
        .collection('ModelTypes')
        .valueChanges()
        .subscribe((docs) => {
          let modelTypes = (docs as any[]) ?? [];

          let models: Dict<AIModelType> = {};

          modelTypes.forEach((model) => {
            models[model.id] = new AIModelType(model.name, model.id, {});
          });

          this.db
            .collection('Models', (ref) =>
              ref.where('status', '==', 0).orderBy('rank', 'asc')
            )
            .valueChanges()
            .subscribe((docs) => {
              let docs_2 = (docs as any[]) ?? [];

              docs_2.forEach((d) => {
                models[d.type].models[d.id] = new AIModel(
                  d.name,
                  d.id,
                  d.developer,
                  d.api,
                  d.imgUrl,
                  d.type,
                  d.status,
                  d.trainable,
                  d.description
                );
              });
              this.loadedModels.next(models);
              callback(models);
            });
        });
    } catch (error) {
      this.loadedModels.next({});
      callback({});
    }
  }

  getTriggers(callback: (result: Dict<Trigger>) => any) {
    try {
      let models: Dict<Trigger> = {};

      this.db
        .collection('Triggers', (ref) => ref.where('status', '==', 0))
        .valueChanges()
        .subscribe((docs) => {
          let docs_2 = (docs as any[]) ?? [];

          docs_2.forEach((d) => {
            models[d.id] = new Trigger(
              d.name,
              d.id,
              d.imgUrl,
              d.status,
              d.execution
            );
          });
          this.loadedTriggers.next(models);
          callback(models);
        });
    } catch (error) {
      this.loadedModels.next({});
      callback({});
    }
  }

  getPlans(callback: (result: Dict<Plan>) => any) {
    try {
      let models: Dict<Plan> = {};

      this.db
        .collection('Plans')
        .valueChanges()
        .subscribe((docs) => {
          let docs_2 = (docs as any[]) ?? [];

          docs_2.forEach((d) => {
            models[d.id] = new Plan(
              d.name,
              d.id,
              d.requests,
              d.overageUnit,
              d.overagePriceCents,
              d.flatPriceCents,
              d.backgroundColor
            );
          });
          this.loadedPlans.next(models);
          callback(models);
        });
    } catch (error) {
      this.loadedPlans.next({});
      callback({});
    }
  }

  getNewWorkflows(callback: (result: Workflow[]) => any) {
    this.db
      .collectionGroup('Workflows', (ref) =>
        ref.where('status', '==', 0).orderBy('created', 'desc')
      )
      .valueChanges()
      .subscribe((docs) => {
        let docs_2 = (docs as any[]) ?? [];
        callback(docs_2);
      });
  }

  getPopularWorkflows(callback: (result: Workflow[]) => any) {
    this.db
      .collectionGroup('Workflows', (ref) =>
        ref.where('status', '==', 0).orderBy('views', 'desc')
      )
      .valueChanges()
      .subscribe((docs) => {
        let docs_2 = (docs as any[]) ?? [];
        callback(docs_2);
      });
  }

  get newUtilID() {
    return this.db.createId();
  }

  getFeaturedWorkflow(callback: (result?: Workflow) => any) {
    let sub2 = this.db
      .collectionGroup(`Engage`)
      .valueChanges()
      .subscribe((docs2) => {
        sub2.unsubscribe();

        let docs_2 = docs2 as any[];

        let d = docs_2[0];

        if (d) {
          let featured = d['Featured'] as string;
          this.getWorkflow(
            featured,
            (result) => {
              callback(result);
            },
            true
          );
        } else {
          callback(undefined);
        }
      });
  }

  getUserInfo(
    uid: string,
    fetchworkflows = true,
    fetchOnlyAvailableworkflows = true,
    callback: (result?: Developer) => any
  ): void {
    var query = this.db.collection('Users', (ref) =>
      ref.where(firebase.firestore.FieldPath.documentId(), '==', uid)
    );

    let sub = query.valueChanges().subscribe(async (docs) => {
      let doc = docs[0] as DocumentData;

      if (doc) {
        let name = doc['name'] as string;
        let email = doc['email'] as string;
        let joined = doc['joined'] as number;
        let uid = doc['uid'] as string;
        let url = doc['url'] as string;
        let myUID = (await this.currentUser)?.uid;
        if (isPlatformBrowser(this.platformID) && uid == myUID) {
          localStorage['url'] = url;
          localStorage['name'] = name;
          localStorage['email'] = email;
        }
        let developer = new Developer(name, uid, joined, url, email);

        this.checkLoadedUser(developer);

        if (fetchworkflows) {
          let q = this.db.collection(`Users/${uid}/workflows`);

          if (fetchOnlyAvailableworkflows) {
            q = this.db.collection(`Users/${uid}/workflows`, (ref) =>
              ref.where('status', 'in', [0, 1]).orderBy('created', 'asc')
            );
          }
          let sub2 = q.valueChanges().subscribe((docs2) => {
            let docs_2 = (docs2 as Workflow[]).map((workflow) => {
              // workflow.layout = this.sampleFlow
              return this.syncWorkflow(workflow);
            });

            developer.utils = docs_2;
            console.log(developer.utils);
            this.checkLoadedUser(developer);

            callback(developer);
            sub2.unsubscribe();
          });
        } else {
          callback(developer);
        }
      } else {
        this.checkLoadedUser(null);
        callback(undefined);
      }
      sub.unsubscribe();
    });
  }

  async updateBlockImage(id: string, imgId: string, file?: File) {
    if (file) {
      try {
        let ref = this.storage.ref(`workflows/${id}/img-${imgId}.png`);

        await ref.put(file, { cacheControl: 'no-cache' });
        let displayUrl = await ref.getDownloadURL().toPromise();
        return displayUrl as string;
      } catch (error) {
        console.log('app');
        return undefined;
      }
    } else {
      try {
        // let ref = this.storage.ref(`workflows/${id}/img-${imgId}.png`);

        // await ref.delete().toPromise();
        return undefined;
      } catch (error) {
        return undefined;
      }
    }
  }

  async saveTrainingData(workflowId: string, uid: string, data: TrainingData) {
    this.loading.next(true);

    var uploadData = JSON.parse(JSON.stringify(data));
    if (uploadData.data == 'None') {
      uploadData.data = '';
    }
    await this.db
      .collection(`Users/${uid}/workflows/${workflowId}/data`)
      .doc(data.id)
      .set(uploadData, { merge: true });
    this.loading.next(false);
  }

  async saveAPI(workflowId: string, uid: string, data: APIRequest) {
    this.loading.next(true);

    var uploadData = JSON.parse(JSON.stringify(data));
    // if (uploadData.data == 'None') {
    //   uploadData.data = '';
    // }
    await this.db
      .collection(`Users/${uid}/workflows/${workflowId}/APIs`)
      .doc(data.id)
      .set(uploadData, { merge: true });
    this.loading.next(false);
  }

  getTrainingData(workflowId: string, uid: string) {
    this.db
      .collection(`Users/${uid}/workflows/${workflowId}/data`)
      .valueChanges()
      .subscribe((docs2) => {
        let data = docs2 as TrainingData[];

        var returnData: Dict<TrainingData> = {};

        data.forEach((d) => {
          returnData[d.id] = d;
        });

        this.loadedTrainingData.next(returnData);
      });
  }

  getAPIKeys(workflowId: string, uid: string) {
    this.db
      .collection(`Users/${uid}/workflows/${workflowId}/keys`)
      .valueChanges()
      .subscribe((docs2) => {
        let data = docs2 as Key[];

        var returnData: Dict<Key> = {};

        data.forEach((d) => {
          returnData[d.id] = d;
        });

        this.loadedKeys.next(returnData);
      });
  }

  getAPIs(workflowId: string, uid: string) {
    this.db
      .collection(`Users/${uid}/workflows/${workflowId}/APIs`)
      .valueChanges()
      .subscribe((docs2) => {
        let data = docs2 as APIRequest[];

        var returnData: Dict<APIRequest> = {};

        data.forEach((d) => {
          returnData[d.id] = d;
        });

        this.loadedRequests.next(returnData);
      });
  }

  async saveAPIKeys(workflowId: string, uid: string, data: Key) {
    this.loading.next(true);

    var uploadData = JSON.parse(JSON.stringify(data));
    if (uploadData.key == 'None') {
      uploadData.key = '';
    }
    await this.db
      .collection(`Users/${uid}/workflows/${workflowId}/keys`)
      .doc(data.id)
      .set(uploadData);

    this.loading.next(false);
  }

  async updateAppImage(id: string, imgId: string, file?: File) {
    this.loading.next(true);

    if (file) {
      try {
        let ref = this.storage.ref(`workflows/${id}/app-${imgId}.png`);

        await ref.put(file, { cacheControl: 'no-cache' });
        let displayUrl = await ref.getDownloadURL().toPromise();
        this.loading.next(false);

        return displayUrl as string;
      } catch (error) {
        console.log('app');
      }
    }
    this.loading.next(false);

    return undefined;
  }

  async getExecutable(
    uid: string,
    id: string,
    callback: (sources: Dict<Agent>) => any
  ) {
    this.db
      .collection(`Users/${uid}/workflows/${id}/source`)
      .valueChanges()
      .subscribe((docs2) => {
        let data = docs2 as Agent[];

        var returnData: Dict<Agent> = {};

        data.forEach((d) => {
          returnData[d.id] = d;
        });

        console.log(returnData);

        callback(returnData);
      });
  }

  async uploadExecutable(id: string, file: Executable) {
    const jsonString = JSON.stringify(JSON.parse(JSON.stringify(file)));

    const blob = new Blob([jsonString], { type: 'application/json' });

    if (file && blob) {
      try {
        let ref = this.storage.ref(`workflows/${id}/${id}.vai`);

        await ref.put(blob, { cacheControl: 'no-cache' });

        let displayUrl = await ref.getDownloadURL().toPromise();

        return displayUrl as string;
      } catch (error) {
        console.log('app');
      }
    }

    return undefined;
  }

  async saveCode(
    uid: string,
    id: string,
    data: { id: string; source: string | null }
  ) {
    this.loading.next(true);

    var uploadData = JSON.parse(JSON.stringify(data));

    console.log(uploadData)
    await new Promise((resolve, reject) => {
      this.functions
      .httpsCallable('saveCodes')({id, uploadData})
      .pipe(first())
      .subscribe(
        async (resp) => {
          console.log(resp);
          resolve(resp);
        },
        (err) => {
          console.error({ err });
          reject();
        }
      );
    })
    

    this.loading.next(false);
  }

  async deleteCode(
    uid: string,
    id: string,
    data: { id: string; source: string | null }
  ) {
    this.loading.next(true);


    await this.db
      .collection(`Users/${uid}/workflows/${id}/source`)
      .doc(data.id)
      .delete();

    this.loading.next(false);
  }

  getIcons(callback: (data: any) => any) {
    this.functions
      .httpsCallable('retrieveIcons')({})
      .pipe(first())
      .subscribe(
        async (resp) => {
          console.log(resp);
          callback(resp);
        },
        (err) => {
          console.error({ err });
          callback([]);
        }
      );
  }

  testAPI(modelId: string, input: any, callback: (data: any) => any) {
    this.functions
      .httpsCallable('apiTest')({ modelId, input, v2: true })
      .pipe(first())
      .subscribe(
        async (resp) => {
          console.log(resp);
          callback(resp);
        },
        (err) => {
          console.error({ err });
          callback('');
        }
      );
  }

  async checkLoadedUser(user: Developer | null) {
    let uid = (await this.currentUser)?.uid;

    if (uid && (!user || uid == user.id)) {
      this.loadedUser.next(user);
    }
  }

  async logView(productId: string, uid: string) {
    if (uid && isPlatformBrowser(this.platformID)) {
      let coords = (await this.getCoords()) ?? this.defaultCoords;
      this.updateView(uid, coords, productId);
    }
  }

  updateView(uid: string, location: any, docId: string) {
    const time = new Date();

    const docName =
      String(time.getFullYear()) +
      String(time.getMonth()) +
      String(time.getDate()) +
      String(time.getHours());

    return this.db
      .collection('Users/' + uid + '/Daily_Info')
      .doc(`V${docName}`)
      .set(
        {
          time: firebase.firestore.FieldValue.arrayUnion({
            time,
            docId,
            coords: location.coords,
            address: location.address,
          }),
          timestamp: time,
          type: 'VIEW',
        },
        { merge: true }
      );
  }

  getMiscStats(
    uid: string,
    date1: Date,
    date2: Date,
    callback: (views?: Dict<any>[]) => any
  ) {
    var views: Dict<any>[] = [];

    let sub = this.db
      .collection('Users/' + uid + '/Daily_Info/', (ref) =>
        ref
          .where('timestamp', '>=', date1)
          .where('timestamp', '<=', new Date(date2.setHours(23, 59, 59, 999)))
      )
      .valueChanges()
      .subscribe((docDatas) => {
        docDatas.forEach((doc, index) => {
          const docData = doc as DocumentData;
          if (docData) {
            let time = docData['time'] as Array<any>;
            let type = docData['type'] as string;
            time.forEach((t) => {
              let p =
                t instanceof firebase.firestore.Timestamp
                  ? (t as firebase.firestore.Timestamp).toDate()
                  : (t.time as firebase.firestore.Timestamp).toDate();
              let v =
                t instanceof firebase.firestore.Timestamp
                  ? this.defaultCoords.coords
                  : t.coords;
              let address =
                t instanceof firebase.firestore.Timestamp
                  ? this.defaultCoords.address
                  : t.address;
              let docId =
                t instanceof firebase.firestore.Timestamp ? undefined : t.docId;
              views?.push({
                num: 1,
                coords: v,
                address,
                docId,
                type,
                timestamp: p,
              });
            });
          }
        });
        callback(views);
        if (isPlatformBrowser(this.platformID)) sub.unsubscribe();
      });
  }

  async getCoords() {
    let value = (await this.http
      .get('https://api.ipify.org/?format=json')
      .toPromise()) as Dict<any>;

    let url = `https://api.ipstack.com/${value['ip']}?access_key=5b5f96aced42e6b1c95ab24d96f704c5`;
    let resp = (await this.http.get(url).toPromise()) as Dict<any>;
    let address = {
      city: resp['city'],
      country: resp['country_name'],
      country_code: resp['country_code'],
      region: resp['region_name'],
      region_code: resp['region_code'],
    };
    let coords = {
      LATITUDE: resp['latitude'],
      LONGITUDE: resp['longitude'],
    };
    return {
      coords,
      address,
    };
  }

  addTags(title: string, imgUrl: string, description: string, url: string) {
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:image', content: imgUrl });
    this.metaService.updateTag({
      property: 'og:image:secure_url',
      content: imgUrl,
    });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({
      property: 'og:description',
      content: description,
    });
    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    // this.metaService.removeTag("name='robots'");
    // this.metaService.removeTag("name='googlebot'");
  }

  async changeLayout(
    layout: any,
    workflow: Workflow,
    step = 1,
    callback: (layout: any) => any
  ) {
    console.log('LAYOUT -- ' + layout.id);
    console.log('workflow -- ' + workflow.id);
    console.log('TYPE -- ' + layout.type);

    try {
      if (workflow && layout) {
        var data = {
          layoutType: layout.type,
          step,
          layoutId: layout.id,
          workflowId: workflow.id,
        };

        if (data) {
          this.functions
            .httpsCallable('editLayouts')(data)
            .pipe(first())
            .subscribe(
              async (newLayout) => {
                console.log(newLayout);
                callback(newLayout ?? layout);
              },
              (err) => {
                console.error({ err });
                callback(layout);
              }
            );
        } else {
          console.log('none');
          callback(layout);
        }
      }
    } catch (error) {
      console.log(error);
      callback(layout);
    }
  }

  async addLayout(
    layout: any,
    workflow: Workflow,
    callback: (layout: any) => any
  ) {
    console.log('man');
    try {
      if (workflow && layout) {
        var data = {
          layout: JSON.parse(JSON.stringify(layout)),
          workflowId: workflow.id,
        };

        console.log(data.layout.authPage);

        if (data) {
          this.functions
            .httpsCallable('saveLayouts')(data)
            .pipe(first())
            .subscribe(
              async (newLayout) => {
                callback(newLayout ?? layout);
              },
              (err) => {
                console.error({ err });
                callback(layout);
              }
            );
        } else {
          console.log('none');
          callback(layout);
        }
      }
    } catch (error) {
      console.log(error);
      callback(layout);
    }
  }

  isBase64(str: string) {
    try {
      return btoa(atob(str)) == str;
    } catch (err) {
      return false;
    }
  }

  registerPlan(
    planId: string,
    modelId: string,
    callback: (result: string, needsBilling: boolean) => any
  ) {
    this.functions
      .httpsCallable('registerPlan')({ planId, modelId })
      .pipe(first())
      .subscribe(
        async (result) => {
          console.log(result);
          callback(result.data, result.needsBilling);
        },
        (err) => {
          console.error({ err });
          callback('', false);
        }
      );
  }

  getBilling(callback: (result: any) => any) {
    this.functions
      .httpsCallable('getBilling')({})
      .pipe(first())
      .subscribe(
        async (result) => {
          console.log(result);
          callback(result);
        },
        (err) => {
          console.error({ err });
          callback(null);
        }
      );
  }

  async addPaymentMethod(id: string) {
    let uid = (await this.currentUser)?.uid;
    if (uid) {
      await this.db
        .doc(`Users/${uid}/docs/billing`)
        .set({ pm: id }, { merge: true });
    }
  }

  syncWorkflow(workflow: any) {
    return new Workflow(
      workflow.id,
      workflow.creatorId,
      workflow.created,
      workflow.modified,
      workflow.creatorName,
      workflow.displayUrl,
      workflow.name,
      workflow.rating,
      workflow.downloads,
      workflow.status,
      workflow.installWebhook,
      workflow.whitelist,
      workflow.layout,
      workflow.tracking,
      workflow.url,
      workflow.apiKey,
      workflow.plan,
      workflow.executableUrl
    );
  }

  sortBranches(def: Definition) {
    function analyzeTasks(tasks: Sequence) {
      tasks.forEach((task) => {
        if (task.componentType == 'switch') {
          let switchTask = task as BranchedStep;
          let order = switchTask.properties['order'] as Dict<any>;
          let branches = switchTask.branches;
          let ordered = Object.keys(order).sort((a, b) => {
            return order[a] - order[b];
          });
          const map1: Map<string, any> = new Map();
          ordered.forEach((key, index) => {
            map1.set(key, branches[key]);
          });
          switchTask.branches = Object.fromEntries(map1);
          map1.forEach((m) => {
            analyzeTasks(m);
          });
        } else if (task.componentType == 'container') {
          let loopTask = task as SequentialStep;
          analyzeTasks(loopTask.sequence);
        }
        return;
      });
    }

    analyzeTasks(def.sequence);

    console.log(def);

    return def;
  }
}

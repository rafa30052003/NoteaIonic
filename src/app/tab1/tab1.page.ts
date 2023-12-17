import { Component, inject } from '@angular/core';
import { IonicModule, LoadingController, AlertController, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { NoteService } from '../services/note.service';
import { UIService } from '../services/ui.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Note } from '../note';
import * as L from 'leaflet';
import { LeafletComponent } from '../modals/leaflet/leaflet.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, ReactiveFormsModule],
})
export class Tab1Page {
  public form!: FormGroup;
  private formB = inject(FormBuilder);
  private noteS = inject(NoteService);
  private UIS = inject(UIService);
  public loadingS = inject(LoadingController);
  private myLoading!: HTMLIonLoadingElement;

  constructor(private alertController: AlertController, private modalController: ModalController) {
    this.form = this.formB.group({
      title: ['', [Validators.required, Validators.minLength(4)]],
      description: [''],
    
      photoURI: [''],
      position: this.formB.group({
        latitude: ['', Validators.required],
        longitude: ['', Validators.required]
      })
    });
  }

  public async saveNote(): Promise<void> {
    if (!this.form.valid) return;
    let note: Note = {
      title: this.form.get("title")?.value,
      description: this.form.get("description")?.value,
      date: Date.now().toLocaleString(),
      img: this.form.get("photoURI")?.value,  
      position: [
        this.form.get("position")?.get("latitude")?.value?.toString(),
        this.form.get("position")?.get("longitude")?.value?.toString()
      ]
    };
    await this.UIS.showLoading();
    try {
      await this.noteS.addNote(note);
      this.form.reset();
      await this.UIS.showToast("Nota introducida correctamente", "success");
    } catch (error) {
      await this.UIS.showToast("Error al insertar la nota", "danger");
    } finally {
      await this.UIS.hideLoading();
    }
  }
  public async takePic() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri
    });
  
    if (image.webPath) {
      const base64Image = await this.convertToBase64(image.webPath);
      this.form.get("photoURI")?.setValue(base64Image);
    } else {
      console.error('No se pudo obtener el webPath de la imagen');
    }
  }
  
  private convertToBase64(webPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        const reader = new FileReader();
        reader.onloadend = function() {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = reject;
      xhr.open('GET', webPath);
      xhr.responseType = 'blob';
      xhr.send();
    });
  }

  public async openMapModal() {
    const modal = await this.modalController.create({
      component: LeafletComponent,
      componentProps: {
        position: this.form.get("position")?.value
      }
    });
  
    modal.onDidDismiss().then((data) => {
      if (data && data.data && typeof data.data === 'object') {
        if ('lat' in data.data && 'lng' in data.data) {
          const { lat, lng } = data.data;
          // Realizar las operaciones que necesites con lat y lng
          this.form.get("position")?.patchValue({ latitude: lat, longitude: lng });
        } else {
          // Manejar el caso en el que data.data no tenga las propiedades lat y lng
          // Establecer posición por defecto como tu posición actual
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            this.form.get("position")?.patchValue({ latitude: latitude, longitude: longitude });
          }, (error) => {
            console.error('Error al obtener la ubicación actual:', error);
            // Manejar el error al obtener la ubicación actual
          });
        }
      } else {
        // Manejar el caso en el que data.data no sea un objeto
        // Establecer posición por defecto como tu posición actual
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          this.form.get("position")?.patchValue({ latitude: latitude, longitude: longitude });
        }, (error) => {
          console.error('Error al obtener la ubicación actual:', error);
          // Manejar el error al obtener la ubicación actual
        });
      }
    });
  
    await modal.present();
  }



}

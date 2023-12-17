import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { Note } from 'src/app/note';
import { NoteService } from 'src/app/services/note.service';
import { LeafletComponent } from '../leaflet/leaflet.component';
import { UIService } from 'src/app/services/ui.service';


@Component({
  selector: 'app-edit-note-modal',
  templateUrl: './edit-note-modal.component.html',
  styleUrls: ['./edit-note-modal.component.scss'],
  standalone : true,
  imports: [IonicModule, FormsModule],
})
export class EditNoteModalComponent implements OnInit {
  note!: Note;
  public noteS: NoteService;
  photoURI: string | undefined;
  private UI: UIService = new UIService;

  constructor(private modalController: ModalController, noteS: NoteService, private alertController: AlertController, UI: UIService) {
    this.noteS = noteS;
    this.UI;
  }

  ngOnInit() {}


  




  cancel() {
    this.modalController.dismiss();
  }

  saveNote() {
    this.noteS.updateNote(this.note)
    
      .then(() => {
        this.UI.showToast('Nota editada correctamente', 'success');
        this.modalController.dismiss();

      })
      .catch((error) => {
        console.error("Error al actualizar la nota:", error);
        this.UI.showToast('Error al editar la nota', 'danger');
      });
  }


  /**
   * IMAGEN
   */

  public async takePic() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri
    });
  
    if (image.webPath) {
      const base64Image = await this.convertToBase64(image.webPath);
      this.note.img = base64Image;
    } else {
      console.error('No se pudo obtener el webPath de la imagen');
    }
  }
  
  private convertToBase64(webPath : string) {
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


  /**
   * MAPA
   */

  
  public async openMapModal() {
    const modal = await this.modalController.create({
      component: LeafletComponent,
      componentProps: {
        position: this.note.position
      }
    });
  
    modal.onDidDismiss().then((data) => {
      console.log('Data:', data);
      console.log('Data.data:', data.data);
    
      if (data && data.data ) {
        
        const { lat, lng } = data.data;
        console.log('lat:', lat);
        console.log('lng:', lng);
        if (this.note) {
          if (this.note.position) {
            if (lat !== undefined && lng !== undefined) {
              this.note.position[0] = lat;
              this.note.position[1] = lng;
            } else {
              console.error('Error: Invalid latitude or longitude');
              // Manejar el caso en el que latitude o longitude sean undefined
            }
          } else {
            this.note.position = [lat ? lat.toString() : '', lng ? lng.toString() : ''];
          }
        } else {
          console.error('Error: this.note is undefined');
          // Manejar el caso en el que this.note no está definido
        }
      } else {
        console.error('Error: Invalid data format');
        // Manejar el caso en el que los datos no sean válidos o estén ausentes
      }
    });
    
    await modal.present();

  }




}
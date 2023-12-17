import { Component,inject } from '@angular/core';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { NoteService } from '../services/note.service';

import { CommonModule } from '@angular/common';
import { EditNoteModalComponent } from '../modals/edit-note-modal/edit-note-modal.component';
import { Note } from '../note';
import { BehaviorSubject, Observable, from, map, mergeMap, tap, toArray } from 'rxjs';


@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonicModule,CommonModule]
})
export class Tab2Page {
  public notes: any[] = []; 
  //public misnotas:Note[]=[];
  public noteS = inject(NoteService);  //noteS.notes$
  public _editNote!:Note;
 
  
  public _notes$:BehaviorSubject<Note[]> = new BehaviorSubject<Note[]>([]);
  private lastNote:Note|undefined=undefined;
  private notesPerPage:number = 15;
  public isInfiniteScrollAvailable:boolean = true;




  constructor(private alertController: AlertController, private modalController: ModalController) {}

  ionViewDidEnter(){
 
    this.noteS.notes$.subscribe((data) => {
      this.notes = data;
    });
  }

  async editNote($event: Note) {
    this._editNote = $event;

    const modal = await this.modalController.create({
      component: EditNoteModalComponent,
      componentProps: {
        note: $event
      }
    });

    await modal.present();
  }
  
  async deleteNote(event: any, note: any) {
    event.stopPropagation(); // Evita la propagación del evento si es necesario
  
    const result = await this.presentAlertConfirm();
    if (result) {
      try {
        await this.noteS.deleteNote(note);
        this.notes = this.notes.filter((n: any) => n.key !== note.key);
        console.log('Nota eliminada con éxito');
      } catch (error) {
        console.error('Error al eliminar la nota', error);
      }
    }
  }
  
  async presentAlertConfirm() {
    return new Promise<boolean>(async resolve => {
      const alert = await this.alertController.create({
        header: 'Confirmar',
        message: '¿Estás seguro de que deseas eliminar esta nota?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => resolve(false)
          },
          {
            text: 'Aceptar',
            handler: () => resolve(true)
          }
        ]
      });
  
      alert.present();
    });
  }

  async noteSwiped(event: any, note: Note) {
    if (event.detail.side === 'end') {
      await this.deleteNote(event, note);
    } else {
      await this.editNote(note);
    }
  }


 loadNotes(fromFirst:boolean, event?:any){

    if(fromFirst==false && this.lastNote==undefined){
      this.isInfiniteScrollAvailable=false;
      event.target.complete();
      return;
    } 
    this.convertPromiseToObservableFromFirebase(this.noteS.readNext(this.lastNote,this.notesPerPage)).subscribe(d=>{
      event?.target.complete();
      if(fromFirst){
        this._notes$.next(d);
      }else{
        this._notes$.next([...this._notes$.getValue(),...d]);
        if(d.length<this.notesPerPage){
          this.isInfiniteScrollAvailable=false;
        }
      }
    })

  }


  private convertPromiseToObservableFromFirebase(promise: Promise<any>): Observable<Note[]> {
    return from(promise).pipe(
      tap(d=>{
        if(d.docs && d.docs.length>=this.notesPerPage){
          this.lastNote=d.docs[d.docs.length-1];
        }else{
          this.lastNote=undefined;
        }
      }),
      mergeMap(d =>  d.docs),
      map(d => {
        return {key:(d as any).id,...(d as any).data()};
      }),
      toArray()
    );
  }

  doRefresh(event: any) {
    this.isInfiniteScrollAvailable=true;
    this.loadNotes(true,event);
  }

  loadMore(event: any) {
    this.loadNotes(false,event);
  }


  formatDate(dateString: string): string {
    const timestamp = parseInt(dateString);
    const date = new Date(timestamp * 1000);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('es-ES', options);
    return formattedDate;
  }
}

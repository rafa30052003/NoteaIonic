import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import * as L from 'leaflet';

@Component({
  selector: 'app-leaflet',
  templateUrl: 'leaflet.component.html',
  styleUrls: ['leaflet.component.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class LeafletComponent implements OnInit {
  @Input() initialLocation: { lat: number; lng: number } | undefined;
  @Input() isEditMode: boolean = false;
  map: L.Map | undefined;
  marker: L.Marker | undefined;
  position: { lat: number; lng: number } | undefined;

  // Declara la variable greenIcon
  greenIcon: L.Icon | undefined;

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      setTimeout(() => {
        this.map = L.map(mapElement).setView([51.505, -0.09], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
          maxZoom: 18
        }).addTo(this.map);

        // Asigna el valor a greenIcon
        this.greenIcon = L.icon({
          iconUrl: 'assets/icons/leaf-green.png',
          iconSize: [50, 125],
          iconAnchor: [30, 125],
          popupAnchor: [-5, -95]
        });

        this.map.on('click', (event) => {
          const { lat, lng } = event.latlng;
          this.setMarker(lat, lng);
          this.position = { lat, lng };
        });

        if (this.isEditMode && this.initialLocation) {
          this.setMarker(this.initialLocation.lat, this.initialLocation.lng);
        } else {
          // Obtener la ubicación actual
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
              const { latitude, longitude } = position.coords;
              this.setMarker(latitude, longitude);
            }, (error) => {
              console.error('Error al obtener la ubicación actual:', error);
            });
          } else {
            console.error('El navegador no admite la geolocalización');
          }
        }
      }, 1000);

      
    }
  }

  setMarker(lat: number, lng: number) {
    if (this.map && this.greenIcon) {
      if (this.marker) {
        this.marker.removeFrom(this.map); // Elimina el marcador existente
      }
      this.marker = L.marker([lat, lng], { icon: this.greenIcon }).addTo(this.map);
    }
  }

  public selectLocation() {
    if (!this.position) {
      // Obtener la ubicación actual
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          this.position = { lat: latitude, lng: longitude };
          this.modalController.dismiss(this.position);
        }, (error) => {
          console.error('Error al obtener la ubicación actual:', error);
          this.modalController.dismiss(null); // Cerrar el modal sin ninguna ubicación
        });
      } else {
        console.error('El navegador no admite la geolocalización');
        this.modalController.dismiss(null); // Cerrar el modal sin ninguna ubicación
      }
    } else {
      this.modalController.dismiss(this.position);
    }
  }
  async closeModal() {
    await this.modalController.dismiss();
  }
}
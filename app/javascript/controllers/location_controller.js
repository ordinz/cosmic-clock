import { Controller } from 'stimulus';
var SunCalc = require('suncalc');
import { DateTime } from "luxon";
var Countdown = require('countdown.js');
import Cookies from "js-cookie";
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // optional for styling

import { WindowsInTime } from 'windows-in-time';

export default class extends Controller {

  static targets = [ "btn", "sunrise", "sunset", "date" ]
  static values = { lat: Number, lng: Number }

  initialize() {

    this.date = DateTime.now()
    
    if( Cookies.get('lat') != undefined && Cookies.get('lng') != undefined ){
      this.btnTarget.classList.add('hidden')
      this.getWindowsInTime( this.date, Cookies.get('lat'), Cookies.get('lng') )
    }else{
      this.getLocation( this.date )
    }

  }

  nextDay() {
    this.date = this.date.plus({days: 1})
    this.getWindowsInTime( this.date, Cookies.get('lat'), Cookies.get('lng') )
  }
  
  previousDay() {
    this.date = this.date.minus({days: 1})
    this.getWindowsInTime( this.date, Cookies.get('lat'), Cookies.get('lng') )
  }

  getWindowsInTime(date) {

    // WindowsInTime is responsible for getting sunrise and sunset time, using the provided Date.
    // WindowsInTime is NOT responsible for getting the lat and lng
    
    let windows_in_time = new WindowsInTime(Cookies.get('lat'), Cookies.get('lng'))
    windows_in_time.earth.setTimes(this.date).then(() => {
      windows_in_time.magic()
      this.addWindows(windows_in_time.windows.intervals, windows_in_time.earth.isToday)
      this.getControllerByIdentifier('sun').init(windows_in_time.earth, windows_in_time.sun)
      this.getControllerByIdentifier('moon').init(windows_in_time.earth, windows_in_time.moon, windows_in_time.earth.daily_ruler)


      this.dateTarget.innerHTML = windows_in_time.earth.sunrise.toFormat("ccc LLL dd")
      this.dateTarget.setAttribute('data-date', windows_in_time.earth.sunrise.toISODate() )

      this.addTippy()
    })
  }

  addWindows(window_intervals, isToday) {

    var focusedOnNext = false

    document.querySelector('#overlaps').innerHTML = _.map( window_intervals, (window) => {

      var html = document.querySelector('.overlapTemplate').cloneNode(true)
      html.classList.remove('hidden')
      var w = html.querySelector('.widget')

      if( isToday && !focusedOnNext && ( window.interval.contains( DateTime.now() ) || window.interval.isAfter( DateTime.now()) ) ){
        w.setAttribute('tabindex', 0)
        w.classList.add('bg-green-100')
        w.classList.add('tabindex')
        w.classList.remove('bg-blue-100')
        focusedOnNext = true // yes focus here
      }

      html.querySelector('.sun-planet').classList.add( window.element )
      html.querySelector('.moon-planet').classList.add( window.planet )

      if( window.golden ){
        w.classList.remove('bg-blue-100')
        w.classList.add('bg-yellow-200')
      }
      
      html.querySelector('.start').innerHTML = window.interval.start.toFormat('HH:mm')
      html.querySelector('.end').innerHTML = window.interval.end.toFormat('HH:mm')
      html.querySelector('.length').innerHTML = window.interval.length('minutes').toFixed() + 'm'

      return html.outerHTML

    }).join('')

    if( isToday ){
      var activeEl = document.querySelector('#overlaps .tabindex')
      _.delay((el) => { el.focus() }, 300, activeEl)
      _.delay((el) => { el.blur() }, 350, activeEl)
    }
  
  }

  addTippy() {
    var elements = ["air", "water", "earth", "fire", "spirit"]
    _.each(elements, (e) => {
      _.each( _.concat(e, this.elementToPlanets(e)), (el) => {
        tippy('.' + el, {content: _.capitalize(el)})
      } )
    })
    
  }

  getLocation( date ) {

    console.log('getLocation')
    navigator.geolocation.getCurrentPosition((position) => {
      this.latValue = position.coords.latitude;
      this.lngValue = position.coords.longitude;
      Cookies.set('lat', this.latValue)
      Cookies.set('lng', this.lngValue)
      this.getWindowsInTime( date )
    })

  }

  elementToPlanetsHTML(element){
    return _.map(this.elementToPlanets(element), (e) => {
      return elementToHTML(e)
    }).join('')
  }

  elementToHTML(e, otherClasses) {
    return ['<div class="', e, ' ', otherClasses, ' mr-2"></div>'].join('')
  }

  elementToPlanets(element){
    switch (element) {
      case 'fire':
        return ['sun', 'mars']
      case 'water':
        return ['mercury', 'saturn']
      case 'air':
        return ['venus', 'jupiter']
      case 'earth':
        return ['moon', 'fixed stars']
    }
  }

  getControllerByIdentifier(identifier) {
    return this.application.controllers.find(controller => {
      return controller.context.identifier === identifier;
    });
  }


}
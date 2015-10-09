/// <reference path="../typings/tsd.d.ts" />

module typewriter.line {

	interface ILineAttributes extends ng.IAttributes {
		text:string;
		delay?:number;
	}

	interface ILine {
		text:string;
		delay?:number;
		doneWritting:boolean;
		print:(text:string) => void;
		trigger: () => void;
	}

	class LineCtrl implements ILine {
		text:string;
		delay:number;
		doneWritting:boolean = true;
		print:(text:string) => void;
		private temp:string = '';

		static $inject = ['$timeout', '$scope'];

		constructor(private $timeout:ng.ITimeoutService,
					private $scope:ng.IScope) {

			$scope.$watch(() => this.text, () => this.trigger());
		}

		trigger():void {
			this.temp = '';
			if (this.text != null) {
				this.$scope.$emit('TypewriterLine:start', this.doneWritting);
				this.doneWritting = false;
				this.appendNextLetter(this.text.split(''));
			}
		}

		private appendNextLetter(text:string[]):void {
			this.appendNextLetter = _.throttle((text:string[]) => {
				var letter = text.shift();
				var delay = Math.round(Math.random() * this.delay);
				this.$timeout(() => {
					if (letter != null) {
						this.temp = this.temp + letter;
						this.appendNextLetter(text);
						this.print(this.temp);
					} else {
						this.doneWritting = true;
						this.$scope.$emit('TypewriterLine:done', this.doneWritting);
					}
				}, delay);
			}, this.delay / 2);
			this.appendNextLetter(text);
		}
	}

	export class LineDirective implements ng.IDirective {
		restrict = 'E';
		scope = true;
		controller = LineCtrl;
		controllerAs = 'WL';
		bindToController = {
			text: '=',
			delay: '@?'
		};
		template = "<span></span><cursor ng-class='{active: !WL.doneWritting, last: $last}'>&nbsp;</cursor>";

		link($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ILineAttributes, WL:ILine) {
			var span = $element.find('span');
			WL.print = (text:string) => span.text(text);
		}

		static Factory:ng.IDirectiveFactory = () => new LineDirective();
	}

	angular.module('touk.typewriter.line', ['touk.typewriter'])
		.directive("ttLine", LineDirective.Factory);
}
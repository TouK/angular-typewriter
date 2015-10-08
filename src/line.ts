/// <reference path="../typings/tsd.d.ts" />

module typewriter.line {

	interface ILine {
		text:string;
		result:string;
		delay:number;
		doneWritting:boolean;
	}

	class LineCtrl implements ILine {
		text:string;
		result:string = '';
		delay:number = 100;
		doneWritting:boolean = true;

		static $inject = ['$timeout','$scope'];

		constructor(private $timeout:ng.ITimeoutService, private $scope:ng.IScope) {
			$scope.$watch(() => this.text, () => {
				this.result = '';
				if (this.text != null) {
					this.$scope.$emit('TypewriterLine:start', this.doneWritting);
					this.doneWritting = false;
					this.print(this.text.split(''));
				}
			});
		}

		private print(text:string[]):void {
			this.print = _.debounce((text:string[]) => {
				var letter = text.shift();
				var delay = Math.round(Math.random() * this.delay);
				this.$timeout(() => {
					if (letter != null) {
						this.result = this.result + letter;
						this.print(text);
					} else {
						this.doneWritting = true;
						this.$scope.$emit('TypewriterLine:done', this.doneWritting);
					}
				}, delay);
			}, this.delay/2);
			this.print(text);
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
		template = "<span ng-class='{active: !WL.doneWritting, last: $last}'>{{WL.result}}<cursor>&nbsp;</cursor></span>";

		static Factory:ng.IDirectiveFactory = () => new LineDirective();
	}

	angular.module('touk.typewriter.line', ['touk.typewriter'])
		.directive("ttLine", LineDirective.Factory);
}